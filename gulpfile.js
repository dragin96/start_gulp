'use strict';
const gulp = require('gulp'),
			watch = require('gulp-watch'),
			plumber = require('gulp-plumber'),//остановки ошибки
			sass = require('gulp-sass'),//компилятор сас
			sourcemaps = require('gulp-sourcemaps'),//создание карт
			browserSync = require("browser-sync"),//сервер
			reload = browserSync.reload,
			rigger = require('gulp-rigger'),//склейка(импорт)
			cssmin = require('gulp-minify-css'),//минификатор цсс
			cssunit = require('gulp-css-unit'),//перевод в ремы
			gcmq = require('gulp-group-css-media-queries'),//сборка всех условий
			sassGlob = require('gulp-sass-glob'),//импорт вложеный
			uncss  = require ('gulp-uncss'),//удаление лишнего кода
			autoprefixer = require('gulp-autoprefixer'),//автопрефикс
			htmlhint = require("gulp-htmlhint"),//валидатор
			svgSprite = require('gulp-svg-sprites'),//спрайт
			svgmin = require('gulp-svgmin'),//минимизатор
			cheerio = require('gulp-cheerio'),//удаление атрибутов
			replace = require('gulp-replace'),//багфикс
			imagemin = require('gulp-imagemin'),			//оптемизатор 
			concat   = require('gulp-concat'),
			font2css = require('gulp-font2css'),
			pngquant = require('imagemin-pngquant');	//картинок
var path = {
	build: {
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		img: 'build/img/',
		fonts: 'build/fonts/',
		svg: 'build/'
	},
	src: {
		html: 'src/*.html',
		js: 'src/js/main.js',
		style: 'src/style/main.scss',
		img: 'src/img/**/*.*',
		fonts: 'src/fonts/**/*.*',
		svg: 'src/svg/**/*.svg'
	},
	watch: {
		html: 'src/**/*.html',
		js: 'src/js/**/*.js',
		style: 'src/style/*.scss',
		img: 'src/img/**/*.*',
		fonts: 'src/fonts/**/*.*',
		svg: 'src/svg/**/*.svg'
	},
	clean: './build'
};

var config = {
	server: {
		baseDir: "build"
	},
	tunnel: true,
	host: 'localhost',
	port: 9000,
	logPrefix: "Frontend_DRAGIN"
};

gulp.task('webserver', function () {
	browserSync(config);
});

gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

gulp.task('html:build', function () {
	gulp.src(path.src.html)
	.pipe(plumber())
	.pipe(rigger())
	.pipe(htmlhint())
  .pipe(htmlhint.reporter())
	.pipe(gulp.dest(path.build.html))
	.pipe(reload({stream: true}))
});

gulp.task('style:build', function () {
	gulp.src(path.src.style)
	.pipe(plumber())
	.pipe(sourcemaps.init())
	.pipe(sassGlob())//вложеный импорт
	.pipe(sass())//{outputStyle: 'compressed'}//компиляция
	.pipe(cssunit({
      type:'px-to-rem',
      rootSize: 16
   }))//первод в ремы
	/* перед финальной сборки вкл
	.pipe(uncss({
    html: ["src/template/*.html","src/index.html"]
  }))//чистка кода от неиспользуемого кода*/
	.pipe(cssmin()) //Сожмем
  .pipe(sourcemaps.write())
/*	.pipe(autoprefixer({
		browsers: ['last 2 versions'],
		}))//автопрефикс*/
	.pipe(gcmq())
	.pipe(gulp.dest(path.build.css))//перемещение
	.pipe(reload({stream: true}))//перезагрузка
});

gulp.task('svg:build', function () {
	gulp.src(path.src.svg)
		// minify svg
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		// remove all fill and style declarations in out shapes
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
				$('[style]').removeAttr('style');
			},
			parserOptions: { xmlMode: true }
		}))
		// cheerio plugin create unnecessary string '>', so replace it.
		.pipe(replace('&gt;', '>'))
		// build svg sprite
		.pipe(svgSprite({
				mode: "symbols",
				preview: false,
				selector: "icon-%f",
				svg: {
					symbols: 'symbol_sprite.html'
				}
			}
		))
		.pipe(gulp.dest(path.build.svg));
});

gulp.task('image:build', function () {
	gulp.src(path.src.img) 
	/*.pipe(imagemin({
		progressive: true,
		svgoPlugins: [{removeViewBox: false}],
		use: [pngquant()],
		interlaced: true
	}))*/
	.pipe(gulp.dest(path.build.img))
	.pipe(reload({stream: true}));
});

gulp.task('fonts:build', function() {
	gulp.src(path.src.fonts)
	.pipe(gulp.dest(path.build.fonts))
});

gulp.task('build', [
	'html:build',
	'style:build',
	'svg:build',
	'image:build',
	'fonts:build',
	/*'js:build',*/
	]);


gulp.task('watch', function(){
	watch([path.watch.html], function(event, cb) {
		gulp.start('html:build');
	});
	watch([path.watch.style], function(event, cb) {
		gulp.start('style:build');
	});
	watch([path.watch.img], function(event, cb) {
		gulp.start('image:build');
	});
	watch([path.watch.fonts], function(event, cb) {
		gulp.start('fonts:build');
	});
		watch([path.watch.svg], function(event, cb) {
		gulp.start('svg:build');
	});
	/*watch([path.watch.js], function(event, cb) {
		gulp.start('js:build');
	});
	*/
});


gulp.task('default', ['build', 'webserver', 'watch']);
