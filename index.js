const path = require('path');
const fs = require('fs');
const lutils = require('loader-utils');
const xml2js = require('xml2js');
const template = require('lodash/template');
const camelCase = require('lodash/camelCase');
const assign = require('lodash/assign');
const keys = require('lodash/keys');
const sanitize = require('./util/sanitize');

let Tmpl;

function readTemplate(callback, filepath) {
  fs.readFile(filepath, 'utf8', (error, contents) => {
    if (error) {
      throw error;
    }
    Tmpl = template(contents);
    callback();
  });
}


function getName(filepath) {
  const ext = path.extname(filepath);
  const basename = path.basename(filepath, ext);
  return basename[0].toUpperCase() + camelCase(basename.slice(1));
}

function renderJsx(displayName, xml, callback) {
  const tagName = keys(xml)[0];
  const root = xml[tagName];

  const props = assign(sanitize(root).$ || {});

  delete props.id;

  const xmlBuilder = new xml2js.Builder({ headless: true });
  const xmlSrc = xmlBuilder.buildObject(xml);
  const component = Tmpl({
    displayName,
    defaultProps: props,
    innerXml: xmlSrc.split(/\n/).slice(1, -1).join('\n'),
  });

  callback(null, component);
}

/**
 * @param {String} source
 */
module.exports = function (source) {
  // read our template
  const tmplPath = path.join(__dirname, '/util/svg.tpl');

  // let webpack know about us, and get our callback
  const callback = this.async();
  this.addDependency(tmplPath);
  this.cacheable();

  // parameters to the loader
  const query = lutils.parseQuery(this.query || '?');
  const rsrcPath = this.resourcePath;
  const rsrcQuery = lutils.parseQuery(this.resourceQuery || '?');

  const displayName = rsrcQuery.name || query.name || getName(rsrcPath);

  const render = function () {
    const xmlParser = new xml2js.Parser();
    xmlParser.parseString(source, (error, xml) => {
      if (error) {
        callback(error);
        return;
      }
      renderJsx(displayName, xml, callback);
    });
  };

  if (Tmpl) {
    render();
  } else {
    readTemplate(render, tmplPath);
  }
};
