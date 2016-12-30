#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ini = require('ini');
const mkdirp = require('mkdirp');
const argv = require('minimist')(process.argv.slice(2));
const sleep = require('then-sleep');
const prompt = require('prompt');
const chalk = require('chalk');

/*
Set custom properties for `prompt`
*/
prompt.message = 'NEW';
prompt.delimiter = ': ';

/*
Define the working directory
*/
let workDir;

if (argv._[0] != undefined) {
  workDir = path.join(process.cwd(), argv._[0]);
  if (!fs.existsSync(workDir)) {
    // Create if it does not exist
    mkdirp(workDir, function (err) {
      if (err) throw err;
    });
  }
} else {
  workDir = process.cwd();
}

/*
Search for git repos
*/
let git;

fs.readFile(path.join(workDir, '.git/config'), (err, data) => {
  if (!err) git = ini.decode(data.toString())['remote "origin"'].url;
});


/*
Search for a main file
*/
let main;

fs.readdir(workDir, function (err, files) {
  if (err) throw err;
  let i = 0;
  let file;
  for (var part in files) {
    if (files[part].indexOf('.js', files[part].length - 3) !== -1) {
      i++;
      file = files[part];
    }
  }
  if (i == 1) {
    main = file;
  }
});


/*
Auto generate name for package
*/
let name = path.basename(workDir, '');

let done = false;

/*
Get userinput
*/
sleep(15).then(function () {
  const schema = {
    properties: {
      name: {
        default: name,
        required: true,
        type: 'string',
        message: 'Your package must have a name'
      },
      main: {
        default: main,
        type: 'string'
      },
      repository: {
        default: git,
        type: 'string'
      },
      version: {
        default: '1.0.0',
        required: true,
        type: 'string',
        message: 'Your package must have a version'
      },
      description: {
        type: 'string'
      },
      keywords: {
        type: 'string'
      },
      license: {
        default: 'MIT',
        type: 'string'
      },
      author: {
        type: 'string'
      }
    }
  };

  prompt.start();

  prompt.get(schema, function (err, result) {
    if (!err) {
      if (result.keywords !== '') {
        result.keywords = result.keywords.split(" ");
      }

      // Write generated `package.json` file
      fs.writeFile(path.join(workDir, 'package.json'), JSON.stringify(result, '\n\t'), (err) => {
        if (err) throw err;
        console.log(chalk.green('\n  Done!'));
        done = true;
      });
    }
  });
});

/*
If user stops
*/
process.on('exit', function() {
  if (!done) {
    console.log(chalk.red('\n\n  Aborted'));
  }
});
