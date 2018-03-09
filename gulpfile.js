const gulp = require('gulp');
const path = require('path')

// 获取 uglify 模块（用于压缩 JS）
const uglify = require('gulp-uglify');
const cssUglify = require('gulp-minify-css');
const imageMin = require('gulp-imagemin');
const fs = require('fs-extra')
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');
// 压缩 js 文件
// 在命令行使用 gulp script 启动此任务
gulp.task('script', function () {
  // 1. 找到文件
  gulp.src('./public/javascripts/*.js')
  // 2. 压缩文件
    .pipe(uglify({
      mangle: false
    }))
    // 3. 另存压缩后的文件
    .pipe(gulp.dest('./dist/javascripts'))
})

gulp.task('auto', function () {
  gulp.watch('./public/javascripts/*.js', ['script'])
  gulp.watch('./public/stylesheets/*.css', ['css'])
  // gulp.watch('images/*.*', ['image'])
})

gulp.task('css', function () {
  gulp.src('./public/stylesheets/*.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([require('autoprefixer')]))
    .pipe(sourcemaps.write('.'))
    .pipe(cssUglify())
    .pipe(gulp.dest('./dist/stylesheets'))
  
})

// gulp.task('image', function () {
//   gulp.src('images/*.*')
//     .pipe(imageMin({
//       progressive: true
//     }))
//     .pipe(gulp.dest('dist/images'))
// })

gulp.task('go', function () {
  fs.copy('./public/images', './dist/images').then(() => {
    console.log("images ok！")
    return fs.copy('./public/img', './dist/img')
  }).then(() => {
    console.log("img ok！")
    return fs.copy('./public/lib', './dist/lib')
  }).then(() => {
    console.log("lib ok！")
    return fs.copy('./public/media', './dist/media')
  }).then(() => {
    console.log("media ok")
  }).catch((err) => {
    console.log(err)
  })
})

gulp.task('default', ['script', 'auto', 'css', 'go'])
gulp.run('default')