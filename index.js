const _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  walk = require('walk');

let showDir = process.cwd();
let showName = require('path').basename(showDir);

let seFiles = {};

let walker = walk.walk(showDir, { followLinks: false });

walker.on('file', function(root, stat, next) {
  let matches = stat.name.match(/S\d\dE\d\d/gi, '');
  if (matches && matches.length > 0) {
    let seasonEpisode = matches[0].toUpperCase();
    if (!(seasonEpisode in seFiles)) {
      seFiles[seasonEpisode] = [];
    }
    let file = path.join(root, stat.name);

    let fInfo = {};
    fInfo.path = file;
    fInfo.size = fs.statSync(file).size;
    seFiles[seasonEpisode].push(fInfo);
  } else {
    let fileToDelete = path.join(root, stat.name);
    console.log(
      `- deleting ${fileToDelete} (${fs.statSync(fileToDelete).size})`
    );
    fs.unlinkSync(fileToDelete);
  }
  next();
});

function getAllSubDirs(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results.push(file);
      /* Recurse into a subdirectory */
      results = results.concat(getAllSubDirs(file));
    }
  });
  return results;
}

walker.on('end', function() {
  for (var se in seFiles) {
    let files = _.sortBy(seFiles[se], 'size');
    let primaryFile = files[files.length - 1];
    for (i = 0; i < files.length - 1; i++) {
      console.log(`- deleting ${files[i].path} (${files[i].size})`);
      fs.unlinkSync(files[i].path);
    }

    let expectedLocation = path.join(
      showDir,
      `${showName} ${se}${path.extname(primaryFile.path)}`
    );
    if (!fs.existsSync(expectedLocation)) {
      console.log(`- moving ${primaryFile.path} to ${expectedLocation}`);
      fs.renameSync(primaryFile.path, expectedLocation);
    }
  }

  let subDirs = _.sortBy(getAllSubDirs(showDir), d => d.length);
  subDirs = subDirs.reverse();
  for (i = 0; i < subDirs.length; i++) {
    console.log(`- removing empty dir: ${subDirs[i]}`);
    fs.rmdirSync(subDirs[i]);
  }
});
