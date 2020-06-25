// XXX this needs to be refactored... pretty old stuff in here.

const gulp = require( 'gulp' ),
      buffer = require( 'vinyl-buffer' ),
      uglify = require( 'gulp-uglify' ),
      watchify = require( 'watchify' ),
      browserify = require( 'browserify' ),
      source = require('vinyl-source-stream'),
      rename = require( 'gulp-rename' ),
      replace= require( 'gulp-replace' ),
      beautify=require( 'gulp-beautify' ),
      validate=require( 'gulp-json-validator' ),
      fs     = require( 'fs' )

gulp.task( 'client', function(){
  //var out = gulp.src( './js/audio.js' )//gulp.src( './node_modules/gibber.core.lib/scripts/gibber.js')
  const out = browserify({ standalone:'Gibber' }) //, transform:['glslify'] })
    .require( './js/audio.js', { entry: true })
    .bundle()
    .on( 'error', console.log )
    .pipe( source('gibber.audio.js' ) )
    .pipe( gulp.dest('./dist/') )
/*    .pipe( buffer() )
    .pipe( uglify() )
    .pipe( rename('gibber.audio.lib.min.js') )
    .pipe( gulp.dest('./build/') )
*/    
    return out
});

gulp.task('watch', function() {
  var bundler = watchify( browserify('./js/audio.js', { standalone:'Gibber', cache: {}, packageCache: {}, fullPaths: true, verbose:true } ) );

  bundler.on('update', rebundle);

  function rebundle() {
    const date = new Date()
    console.log("recompiling... ", date.getHours(), date.getMinutes(), date.getSeconds() )
    return bundler.bundle()
      // log errors if they happen
      .on( 'error', console.log ) 
      .pipe( source( 'bundle.js' ) )
      .pipe( rename( 'gibber.audio.js' ) )
      .pipe( gulp.dest( './dist/' ) )
      // .pipe( uglify() )
      // .pipe( rename('gibber.audio.lib.min.js') )
      // .pipe( gulp.dest('./build/') )
  }

  return rebundle();
});

gulp.task( 'tern', function() {
  const seq = fs.readFileSync( './playground/terndefs/gibberdef.seq.mixin.txt' ).toString('utf-8')
  const env = fs.readFileSync( './playground/terndefs/gibberdef.env.mixin.txt' ).toString('utf-8')
  const pan = fs.readFileSync( './playground/terndefs/gibberdef.pan.mixin.txt' ).toString('utf-8')
  const filter = fs.readFileSync( './playground/terndefs/gibberdef.filter.mixin.txt' ).toString('utf-8')
  const src = gulp.src( './playground/terndefs/gibberdef.template.json' )
        .pipe( replace( 'ENVMIXIN', env ) )
        .pipe( replace( 'FILTERMIXIN', filter ) )
        .pipe( replace( 'PANMIXIN', pan ) )
        .pipe( replace( 'SEQMIXIN', seq ) )
        .pipe( beautify.js({ indent_size:2 }) )
        .pipe( validate({ allowDuplicatedKeys:true }) )
        .pipe( rename( 'gibber.audio.def.json' ) )
        .pipe( gulp.dest('./playground/terndefs' ) )

   gulp.src( './playground/terndefs/gibber.graphics.template.json' )
        .pipe( replace( 'SEQMIXIN', seq ) )
        .pipe( beautify.js({ indent_size:2 }) )
        .pipe( validate({ allowDuplicatedKeys:true }) )
        .pipe( rename( 'gibber.graphics.def.json' ) )
        .pipe( gulp.dest('./playground/terndefs' ) )
})

gulp.task( 'p5', ['client'], function() {
  var out = gulp.src( './build/gibber.audio.lib.js'  )
    .pipe( gulp.dest('/www/p5.gibber.js/node_modules/gibber.lib/build/') )
    .pipe( buffer() )
    .pipe( uglify() )
    .pipe( rename('gibber.audio.lib.min.js') )
    .pipe( gulp.dest('/www/p5.gibber.js/node_modules/gibber.lib/build/') )
    return out
})

gulp.task( 'default', ['client'] )
