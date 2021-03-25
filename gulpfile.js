"use strict";

const gulp = require("gulp"),
  fs = require("fs"),
  axios = require("axios"),
  plugins = require("gulp-load-plugins")({ pattern: [ "gulp-*", "gulp.*", "asset-builder", "babelify", "beeper", "browserify", "chalk", "del", "opn", "run-sequence", "semver", "tsify", "watchify", "yargs" ], replaceString: /\bgulp[\-.]/ }),
  browserSync = require("browser-sync").create(),
  source = require("vinyl-source-stream"),
  buffer = require("vinyl-buffer"),
  log = require("fancy-log"),
  args = plugins.yargs.argv,
  config = require("./gulp-config.json"),
  params = require("./package.json"),
  paths = config.paths;

/**
 * Test the build
 */
function test() {
  return !args.release ? Promise.resolve() : checkComponents();
}



/**
 * Clean the build by removing files/directories
 */
function clean() {
  return plugins.del([paths.html.dest + "/index.html", paths.sass.dest, paths.scripts.dest, paths.images.dest], { force: true });
}



/**
 * Compile the styles for the build
 */
function styles() {
  return gulp
    .src(paths.sass.main)
    .pipe(plugins.if(!args.release, plugins.sourcemaps.init()))
    .pipe(
      plugins
      .sass({
        outputStyle: "compressed"
      })
      .on("error", plugins.sass.logError)
    )
    .pipe(plugins.autoprefixer({
      remove: false
    }))
    // .pipe(plugins.purifycss(paths.html.destFiles.concat('./dist/script.js'), {
    //   minify: true,
    //   // info: true,
    //   // rejected: true,
    //   whitelist: ['*svg*', '*slick*', '*is-*', '*mod_*'],
    // }))
    .pipe(plugins.if(!args.release, plugins.sourcemaps.write()))
    .pipe(plugins.size())
    .pipe(gulp.dest(paths.sass.dest))
    .pipe(browserSync.stream())
    .pipe(plugins.notify("Styles ready!"));
}


/**
 * Add in any script libraries needed for the build
 */
function libs() {
  const files = paths.scripts.libs.concat(paths.scripts.plugins);

  return gulp
    .src(files)
    .pipe(plugins.size({showFiles: true}))
    .pipe(plugins.expectFile(files))
    .pipe(plugins.concat("libs.js"))
    // .pipe(plugins.uglify())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(plugins.notify("Libs ready!"));
}



/**
 * Remove the images from the build
 */
function cleanImages() {
  return plugins.del([paths.images.dest], {
    force: true,
  });
}



/**
 * Minify the images for the build
 */
function imagesMinify() {
  return gulp
    .src(paths.images.source)
    .pipe(plugins.newer(paths.images.dest))
    .pipe(
      plugins.imagemin(/* [
        plugins.imagemin.gifsicle({
          interlaced: true
        }),
        plugins.imagemin.mozjpeg({
          quality: 75,
          progressive: true
        }),
        plugins.imagemin.optipng({
          optimizationLevel: 5
        }),
        plugins.imagemin.svgo({
          plugins: [{
            removeViewBox: false,
            collapseGroups: true,
          }, ],
        }),
      ] */)
    )
    .pipe(gulp.dest(paths.images.dest))
    .pipe(
      plugins.notify({
        message: "Images minified successfuly!",
        onLast: true
      })
    );
}



/**
 * Run images through tinyPNG service
 */
function tinyPNG() {
  return gulp
    .src(paths.images.source)
    .pipe(plugins.newer(paths.tinypng.folder))
    .pipe(plugins.tinypng("wkovjZL4HvUjaBOdW3ut7Jh77W7B2jmN"))
    .pipe(gulp.dest(paths.tinypng.folder))
    .pipe(
      plugins.notify({
        message: "Images tinified successfuly!",
        onLast: true
      })
    );
}



/**
 * Copy the tinyPNG images that have been processed
 */
function tinyPNGCopy() {
  return gulp
    .src(paths.tinypng.files)
    .pipe(plugins.newer(paths.images.source))
    .pipe(gulp.dest(paths.images.dest))
    .pipe(plugins.notify({
      message: "Tiny PNGs copied!",
      onLast: true
    }));
}



/**
 * Minify the svgs for the build
 */
function svgMinify() {
  return gulp
    .src(paths.svg.inline)
    .pipe(plugins.newer(paths.svg.dest))
    .pipe(
      plugins.svgmin({
        plugins: [{
          removeViewBox: false
        }],
      })
    )
    .pipe(gulp.dest(paths.svg.dest))
    .pipe(browserSync.stream())
    .pipe(
      plugins.notify({
        message: "SVG minified successfuly!",
        onLast: true
      })
    );
}



/**
 * Copy svgs that should not be minified to the build
 */
function svgNoMinify() {
  return gulp
    .src(paths.svg.nomin)
    .pipe(plugins.newer(paths.svg.dest))
    .pipe(gulp.dest(paths.svg.dest))
    .pipe(
      plugins.notify({
        message: "SVG no-min copied successfuly!",
        onLast: true,
      })
    );
}



/**
 * Generate sprite from svgs
 */
function svgStore() {
  return gulp
    .src(paths.svg.sprite)
    .pipe(
      plugins.svgmin({
        plugins: [{
            removeAttrs: {
              attrs: "(fill|stroke)"
            }
          },
          {
            addAttributesToSVGElement: {
              attribute: 'preserveAspectRatio="xMidYMid meet"',
            },
          },
        ],
      })
    )
    .pipe(plugins.rename({
      prefix: "sprite-"
    }))
    .pipe(plugins.svgstore({
      fileName: "sprite.svg",
      inlineSvg: true
    }))
    .pipe(gulp.dest(paths.svg.dest))
    .pipe(plugins.notify({
      message: "SVG sprite created!",
      onLast: true
    }));
}



/**
 * Insert the svgs into the build
 */
function insertSVGs() {
  const distFiles = ['index', 'dashboard'];
  const pattern = /\[\[svg::([0-9a-z-_]+)\]\]/gm;

  return Promise.all(distFiles.map((file) => {
      return new Promise(function (resolve, reject) {
          try {
              fs.readFile(paths.html.dest + `/${file}.html`, 'utf-8', function (error, html) {

                  let match,
                      matches = [];

                  while ((match = pattern.exec(html))) {
                      matches.push(match[1]);
                  }

                  Promise.all(
                      matches.map(function (name) {
                          return new Promise(function (resolve, reject) {
                              fs.readFile(
                                  paths.svg.dest + name + ".svg",
                                  "utf-8",
                                  function (error, svg) {
                                      if (svg) {
                                          html = html.replace(
                                              `[[svg::${name}]]`,
                                              svg.replace("<svg ", `<svg class="svg-${name}" `)
                                          );
                                      } else {
                                          console.log(`svg '${name}' — not found!`);
                                      }

                                      resolve();
                                  }
                              );
                          });
                      })
                  ).then(function () {
                      fs.writeFileSync(paths.html.dest + `/${file}.html`, html);
                      resolve();
                  });
              });
          } catch(error) {
              return null;
          }
      });
  }));
}



/**
 * Bump the version of the build
 */
function bumpVersion() {
  const version = !!args.release ?
    plugins.semver.inc(params.version, "patch") :
    params.version;

  gulp
    .src([paths.html.dest + "/index.html"])
    .pipe(plugins.replace(/\?v=([^\"]+)/g, "?v=" + version))
    .pipe(gulp.dest(paths.html.dest));

  return gulp
    .src(["./package.json"])
    .pipe(plugins.if(args.release, plugins.bump({
      version: version
    })))
    .pipe(gulp.dest("./"));
}



/**
 * Validate the JSON data file for the buid
 */
function jsonLint() {
  return gulp
    .src(paths.json)
    .pipe(plugins.jsonLint())
    .pipe(plugins.jsonLint.report("verbose"));
}



/**
 * Process the Twig template for the build including any api fetches (global header/footer from WAPO)
 */
async function twig() {
  const dataFiles = ["data", "data-dashboard"];

  await Promise.all(dataFiles.map((file) => {
      let data;
      try {
          data = JSON.parse(fs.readFileSync(`./${file}.json`, "utf8"));
      } catch (err) {
          return null;
      }


      const distFile = `${file.replace(/data-?/, '') || 'index'}.html`;
      console.log(`Rendering ${distFile}`);

      return promisifyStream(
          gulp
          .src("./views/index.twig")
          .pipe(
              plugins.twig({
                  data: data,
              })
          )
          .pipe(plugins.rename(distFile))
          .pipe(gulp.dest(paths.html.dest)));
  }));
}



/**
 * Format the output for the page
 */
function format() {
    return gulp
        .src("./dist/index.html")
        .pipe(plugins.formatHtml({ indent_char: " ", indent_size: 2, preserve_newlines: false }))
        .pipe(gulp.dest(paths.html.dest))
}



/**
 * Check the build to see what components are used (actual/likely based on markup)
 */
function checkComponents() {
  let usedComponents = [],
    unusedComponents = [],
    usedAnimations = [],
    files = paths.html.destFiles;

  return Promise.all(
    files.map(function (file) {
      return new Promise(function (resolve, reject) {
        fs.readFile(file, "utf-8", function (err, _data) {
          console.log("Checking " + plugins.chalk.cyan("%s") + " file…", file);
          if (!_data) {
            console.log("\x1b[31m%s\x1b[0m", "There is no " + file + " file!");
            reject(err);
            return;
          }

          let componentMatches = _data.match(/data-component=\"([A-Za-z]+)\"/gm),
            animationMatches = _data.match(/data-animation=\"([A-Za-z]+)\"/gm);

          usedComponents = usedComponents
            .concat(!componentMatches ? [] : componentMatches.map(function (c) {
                return c.replace('data-component="', "").replace('"', "");
              })
              .filter(function (value, index, array) {
                return array.indexOf(value) == index;
              })
            )
            .sort();

          usedAnimations = !animationMatches ?[] : animationMatches.map(function (a) {
              return a.replace('data-animation="', "").replace('"', "");
            })
            .filter(function (value, index, array) {
              return array.indexOf(value) == index;
            })
            .sort();

          resolve();
        });
      });
    })
  ).then(function () {
    fs.readdirSync(paths.scripts.components).forEach((file) => {
      const component = file.replace(/\..*/, ""),
        used = usedComponents.indexOf(component) > -1 || component === "Component" || component === "All",
        probablyUsed = ["Swipe", "Preview", "Gyro"].indexOf(component) >= 0;

      console.log(
        (used ? "\x1b[32m" : !!probablyUsed ? "\x1b[33m" : "\x1b[31m") +
        "%s\x1b[0m",
        component
      );

      if (!used && !probablyUsed) {
        unusedComponents.push(component);
      }
    });

    if (unusedComponents.length > 0) {
      console.log(plugins.chalk.bgRed("Please remove unused components!"));
    }

    console.log("Used animations: " + usedAnimations.join(", "));
  });
}



/**
 * Bundle all assets for the build
 */
function bundle() {
  const bundler = plugins.browserify({
    basedir: ".",
    debug: !args.release,
    entries: [paths.scripts.main],
    cache: {},
    packageCache: {},
    plugin: [plugins.tsify],
  });

  return bundler
    .transform(plugins.babelify, {
      presets: ["es2015"],
      extensions: [".js", ".ts"],
    })
    .bundle()
    .on("error", function (error) { log.error(error); this.emit("end"); })
    .pipe(source(paths.scripts.file))
    .pipe(buffer())
    // .pipe(plugins.addSrc.prepend(paths.scripts.dest + "/libs.js"))
    // .pipe(plugins.concat(paths.scripts.file))
    .pipe(plugins.if(!args.release, plugins.sourcemaps.init({ loadMaps: true })))
    .pipe(plugins.if(args.release, plugins.uglify()))
    .pipe(plugins.if(!args.release, plugins.sourcemaps.write()))
    .pipe(plugins.size())
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(plugins.notify("Bundle scripts ready!"));
}



/**
 * Watch for any changes in assets used in the bundle of the build
 */
function watchBundle() {
  const bundler = plugins.browserify({
    basedir: ".",
    debug: true,
    entries: [paths.scripts.main],
    cache: {},
    packageCache: {},
    plugin: [plugins.tsify],
  });

  const reBundle = () => {
    log("Starting Re-Bundling of Assets...");

    return bundler
      .bundle()
      .on("error", log.error)
      .pipe(source(paths.scripts.file))
      .pipe(buffer())
      // .pipe(plugins.addSrc.prepend(paths.scripts.dest + "/libs.js"))
      // .pipe(plugins.concat(paths.scripts.file))
      .pipe(gulp.dest(paths.scripts.dest))
      .pipe(browserSync.stream())
      .pipe(plugins.notify("Bundle scripts ready!"));
  };

  bundler.plugin(plugins.watchify, {
    delay: 100,
    ignoreWatch: ["**/node_modules/**"],
    poll: false,
  });

  bundler.on("update", reBundle);
  bundler.on("log", log);

  return reBundle();
}



/**
 * Watch for any changes to the core files/components for the build
 */
function watch() {
  browserSync.init({
    open: true,
    ghostMode: false,
    // server: "/dist",
    proxy: config.proxyURL,
    port: 7000,
    files: ["**/*.twig", "*.json", "*.html", "application/**/*", "*.scss", "*.css"],
  });

  gulp.watch(paths.styles.main, styles);
  gulp.watch(paths.images.source, imagesMinify);
  gulp.watch(paths.html.files, exports.html);
  gulp.watch(
    paths.svg.files,
    gulp.series(svgNoMinify, svgMinify, svgStore, exports.html)
  );
  gulp.watch(paths.json, jsonLint);

  watchBundle();
}



/**
 * Utility for returning a stream as a promise
 */
function promisifyStream(stream) {
  return new Promise((resolve) => stream.on("end", resolve));
}



/**
 * Cleans the build directory
 */
exports.clean = clean;

/**
 * Compiles the css from the scss
 */
exports.styles = styles;

/**
 * Combines all of the js libraries
 */
exports.libs = libs;

/**
 * Compiles all of the javascript components
 */
exports.scripts = bundle;

/**
 * Handles all of the compression and optimization for images/svgs
 */
exports.images = gulp.series(
  cleanImages,
  imagesMinify,
  tinyPNGCopy,
  svgNoMinify,
  svgMinify,
  svgStore
);

/**
 * Executes tinyPNG api
 */
exports.tinyPNG = tinyPNG;

/**
 * Creates the html and updates it with any svgs as applicable
 */
exports.html = gulp.series(twig, insertSVGs, format);

/**
 * Bumps the version
 */
exports.bump = bumpVersion;

/**
 * Tests the build
 */
exports.test = test;

/**
 * Build the page
 */
exports.default = gulp.series(
  exports.clean,
  exports.html,
  exports.styles,
  exports.libs,
  exports.scripts,
  exports.images,
  exports.bump,
  exports.test
);

/**
 * Watches any changes to code and refreshes the browser with a full build
 */
exports.watch = gulp.series(exports.default, watch);
