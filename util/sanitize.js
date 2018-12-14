const keys = require('lodash/keys');
const omit = require('lodash/omit');
const camelCase = require('lodash/camelCase');

const XML_ATTR_KEY = '$';
const XML_TEXT_NODE_KEY = '_';
const NS_SEPARATOR = ':';
const DATA_ATTR_KEY = 'data-svgreactloader';
const XML_NAMESPACE_KEY = 'xmlns';
const TEXT_REGEX = /(["'])/g;

const XML_NAMESPACES = {
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink',
};

const STYLE_ATTR_KEY = 'style';

const RESERVED_KEYS = {
  class: 'className',
  for: 'htmlFor',
};

/**
 * @param {Object[]} nodes
 */
function sanitizeStyleNodes(nodes) {
  nodes.forEach((node, idx, context) => {
    const isText = typeof node === 'string';
    const src = isText ? node : node[XML_TEXT_NODE_KEY];
    const text = `{\`${(src || '').replace(TEXT_REGEX, '\\$1')}\`}`;

    if (isText) {
      context[idx] = text;
    } else {
      node[XML_TEXT_NODE_KEY] = text;
    }
  });
}

/**
 * Remove any non-jsx xml attributes from the given node and any of its child
 * nodes. Return the original node sanitized.
 *
 * @param {Object|Object[]} xmlNode
 * @param {Object} [namespaces]
 * @returns {Object} the node that was given
 */
module.exports = function sanitize(xmlNode, namespaces) {
  namespaces = namespaces || Object.create(XML_NAMESPACES);

  if (Array.isArray(xmlNode)) {
    xmlNode.forEach((child) => {
      sanitize(child, namespaces);
    });
  } else {
    if (xmlNode[XML_ATTR_KEY]) {
      xmlNode[XML_ATTR_KEY] = keys(xmlNode[XML_ATTR_KEY]).reduce((acc, key) => {
        const i = key.indexOf(NS_SEPARATOR);
        const hasSep = !!~i;
        const ns = hasSep && key.slice(0, i);
        const attr = hasSep ? key.slice(i + 1) : key;
        const value = xmlNode[XML_ATTR_KEY][key];
        let nsKey = hasSep ? ns : attr;

        if (nsKey === XML_NAMESPACE_KEY && !hasSep) {
          namespaces.xml = value;
        } else if (nsKey === XML_NAMESPACE_KEY) {
          namespaces[attr] = value;
        }

        nsKey = nsKey === XML_NAMESPACE_KEY ? 'xml' : nsKey;

        if (ns && attr || attr === STYLE_ATTR_KEY) {
          // acc[DATA_ATTR_KEY] = acc[DATA_ATTR_KEY] || [];
          // acc[DATA_ATTR_KEY].push([namespaces[nsKey], attr, value]);
        } else {
          acc[RESERVED_KEYS[key] || camelCase(key)] = value;
        }

        return acc;
      }, {});
    }

    // Process the children of this node
    keys(omit(xmlNode, [XML_ATTR_KEY, XML_TEXT_NODE_KEY])).forEach((key) => {
      const node = xmlNode[key];

      if (typeof node === 'string') {
        // do nothing
      } else if (key === 'style') {
        sanitizeStyleNodes(node);
      } else {
        sanitize(node, namespaces);
      }
    });

    // Serialize our data attribute
    if (xmlNode[XML_ATTR_KEY] && xmlNode[XML_ATTR_KEY][DATA_ATTR_KEY]) {
      // xmlNode[XML_ATTR_KEY][DATA_ATTR_KEY] =
      // JSON.stringify(xmlNode[XML_ATTR_KEY][DATA_ATTR_KEY]);
    }
  }

  return xmlNode;
};
