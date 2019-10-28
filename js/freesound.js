module.exports = function( Audio ) {
  const token = '6a00f80ba02b2755a044cc4ef004febfc4ccd476'

  const Freesound = function( query ) {
    const sampler = Audio.instruments.Sampler({ panVoices:true })
    queries[ typeof query ]( query, sampler )
    return sampler
  }

  Freesound.loaded = {};

  const queries = {
    number( id, sampler ) {
      if (typeof Freesound.loaded[ id ] === 'undefined') {
        fetch( `https://freesound.org/apiv2/sounds/${id}/?&format=json&token=${token}` )
          .then( response => response.json() )
          .then( json => {
            const path = json.previews[ 'preview-hq-mp3' ]

            sampler.path = path

            Audio.Gibberish.proxyEnabled = false

            sampler.__wrapped__.loadFile( path )

            sampler.__wrapped__.onload = buffer => {
              // XXX uncomment next line to reinstate memoization of audio buffers (with errors)
              //Freesound.loaded[ filename ] = buffer
              console.log( `freesound file #${id} loaded.` )
            }

            Audio.Gibberish.proxyEnabled = true
          }) 
      }else{
        if( Audio.Gibberish.mode === 'worklet' ) {
          sampler.loadBuffer( Freesound.loaded[ id ] )
        }
      }
    },

    // search for text query, and then use returned id to 
    // fetch by number 
    string( query, sampler ) {
      console.log( 'Searching freesound for ' + query )
      fetch( `https://freesound.org/apiv2/search/text/?query=${query}&token=${token}` )
        .then( data => data.json() )
        .then( sounds => {
          const filename = sounds.results[0].name
          const id = sounds.results[0].id

          if( Freesound.loaded[ filename ] === undefined ) {
            console.log( `loading freesound file: ${filename}` )
            queries.number( id, sampler )
          }else{
            // XXX memoing the files causes an error
            if( Audio.Gibberish.mode === 'worklet' ) {
              sampler.loadBuffer( Freesound.loaded[ filename ] )
            }
          }
      })
    },

    // search by text query with filters/sorting,
    // pick first hit or random according to query,
    // fetch by associated id number 
    object( query, sampler ) {
      var key = query,
          query = key.query,
          filter = key.filter || null,
          sort = key.sort || 'rating_desc',
          page = key.page || 1;
      
      pick = key.pick

      let path = `https://freesound.org/apiv2/search/text/?&query=${query}&format=json`

      if( filter !== null ) path += `&filter=${filter}`
      path += `&sort=${sort}`
      path += `&page=${page}`
      path += `&token=${token}`

      if( typeof Freesound.loaded[ query ] === 'undefined') {
        fetch( encodeURI( path ) )
          .then( data => data.json() )
          .then( json => {
            const idx = pick === 'random'
              ? Math.floor( Math.random() * json.results.length )
              : 0

            console.log( 'loading:', json.results[ idx ].name )
            queries.number( json.results[ idx ].id, sampler )
          })
      }else{
        // XXX memoing the files causes an error
        if( Audio.Gibberish.mode === 'worklet' ) {
          sampler.loadBuffer( Freesound.loaded[ query ] )
        }
      }
    }
  }

  return Freesound
}
