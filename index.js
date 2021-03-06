const dedent = require('dedent');
const wrap = require('word-wrap');
const longest = require('longest');
const rightPad = require('right-pad');

const types = require('./types.json');

const maxLineWidth = 100;
const divider = '\n\n';
const length = longest(Object.keys(types)).length + 1;
// rightPad should be replaced with String::padEnd when available (node 8?)
const choices = Object.keys(types).map(key => ({
  name: `${rightPad(key + ':', length)} ${types[key].description}`,
  value: key
}));


module.exports = {
  // cz is an instance of inquirer
  // see: https://github.com/SBoudrias/Inquirer.js
  prompter(cz, commit) {
    console.log(dedent`
      Line 1 will be cropped at ${maxLineWidth} characters.
      All other lines will be wrapped after ${maxLineWidth} characters.
    `);

    // Let's ask some questions of the user
    // so that we can populate our commit
    // template.
    //
    // See inquirer.js docs for specifics.
    // You can also opt to use another input
    // collection library if you prefer.
    cz.prompt([
      {
        type: 'list',
        name: 'type',
        message: dedent`
          Select the type of change that you're committing:
        `,
        choices: choices
      }, {
        type: 'input',
        name: 'scope',
        message: dedent`
          Denote the scope of this change (seed, challenges, map, etc.):
        `
      }, {
        type: 'input',
        name: 'subject',
        message: dedent`
          Write a short, imperative tense description of the change:
        `
      }, {
        type: 'input',
        name: 'body',
        message: dedent`
          Provide a longer description of the change:
        `
      }, {
        type: 'input',
        name: 'breaking',
        message: dedent`
          List any breaking changes:
        `
      }, {
        type: 'input',
        name: 'issues',
        message: dedent`
          List any issues closed by this change:
        `
      }
    ]).then(answers => {
      const wrapOptions = {
        trim: true,
        newline: '\n',
        indent: '',
        width: maxLineWidth
      };

      // parentheses are only needed when a scope is present
      let scope = answers.scope.trim();
      scope = scope ? '(' + answers.scope.trim() + ')' : '';
      // Hard limit this subject line
      const subject = answers.subject.trim().slice(0, maxLineWidth);
      const head = `${answers.type}${scope}: ${subject}`;

      // Wrap these lines at 100 characters
      const body = wrap(answers.body, wrapOptions);

      // Apply breaking change prefix, removing it if already present
      let breaking = answers.breaking.trim();
      breaking = breaking ?
        'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '') :
        '';

      breaking = wrap(breaking, wrapOptions);

      const issues = wrap(answers.issues, wrapOptions);

      // if no breaking or issues filter them out
      const footer = [ breaking, issues ].filter(Boolean).join(divider);
      commit([ head, body, footer ].join(divider));
    });
  }
};
