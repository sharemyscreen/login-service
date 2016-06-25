const fs = require('fs');
const gulp = require('gulp');
const docGen = require('doc-api-gen').APIDocGen;

gulp.task('doc', function (done) {
  const pkg = JSON.parse(fs.readFileSync('./package.json'));

  docGen.generateDoc('./login-service.yaml', './CHANGELOG.md', pkg.version, './doc/', done);
});
