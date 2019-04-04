const _ = require('lodash');
const wrap = require('word-wrap');

const defaultSubjectSeparator = ': ';
const defaultMaxLineWidth = 100;

function addTicketNumber(ticketNumber, config) {
  if (!ticketNumber) {
    return '';
  }
  if (config.ticketNumberPrefix) {
    return `${config.ticketNumberPrefix + ticketNumber.trim()} `;
  }
  return `${ticketNumber.trim()} `;
}

function addScope(scope, config) {
  const separator = _.get(config, 'subjectSeparator', defaultSubjectSeparator);

  if (!scope) return separator; // it could be type === WIP. So there is no scope

  return `(${scope.trim()})${separator}`;
}

function addSubject(subject) {
  return _.trim(subject);
}

function addType(type, config) {
  const prefix = _.get(config, 'typePrefix', '');
  const suffix = _.get(config, 'typeSuffix', '');

  return _.trim(`${prefix}${type}${suffix}`);
}

function addFooter(footer, config) {
  if (config && config.footerPrefix === '') return `\n\n${footer}`;

  const footerPrefix = config && config.footerPrefix ? config.footerPrefix : 'ISSUES CLOSED:';
  return `\n\n${footerPrefix} ${footer}`;
}

module.exports = function buildCommit(answers, config) {
  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent: '',
    width: defaultMaxLineWidth,
  };

  function escapeSpecialChars(result) {
    // eslint-disable-next-line no-useless-escape
    const specialChars = ['`'];

    let newResult = result;
    // eslint-disable-next-line array-callback-return
    specialChars.map(item => {
      // If user types "feat: `string`", the commit preview should show "feat: `\string\`".
      // Don't worry. The git log will be "feat: `string`"
      newResult = result.replace(new RegExp(item, 'g'), '\\`');
    });
    return newResult;
  }

  // Hard limit this line
  // eslint-disable-next-line max-len
  const head = (
    addType(answers.type, config) +
    addScope(answers.scope, config) +
    addTicketNumber(answers.ticketNumber, config) +
    addSubject(answers.subject)
  ).slice(0, defaultMaxLineWidth);

  // Wrap these lines at 100 characters
  let body = wrap(answers.body, wrapOptions) || '';
  body = body.split('|').join('\n');

  const breaking = wrap(answers.breaking, wrapOptions);
  const footer = wrap(answers.footer, wrapOptions);

  let result = head;
  if (body) {
    result += `\n\n${body}`;
  }
  if (breaking) {
    const breakingPrefix = config && config.breakingPrefix ? config.breakingPrefix : 'BREAKING CHANGE:';
    result += `\n\n${breakingPrefix}\n${breaking}`;
  }
  if (footer) {
    result += addFooter(footer, config);
  }

  return escapeSpecialChars(result);
};
