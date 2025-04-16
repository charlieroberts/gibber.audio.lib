module.exports = function( Audio ) {
  const token = '6a00f80ba02b2755a044cc4ef004febfc4ccd476'

  const Freesound = function( query, options ) {
    const props = Object.assign( {}, Freesound.defaultProps,  typeof query === 'object' ? query : options )
    const sampler = Audio.instruments[ props.type ]( props )
    if( sampler.loadSample === undefined ) sampler.loadSample = sampler.__wrapped__.loadSample
    setTimeout( ()=>queries[ typeof query ]( query, sampler, props.count ), 0 )
 
    return sampler
  }

  Freesound.loaded = {}
  Freesound.queries = {}
  Freesound.defaultProps = { count:1, maxVoices:1, panVoices:true, type:'Multisampler' }
  Freesound.defaults = {
    sort: 'downloads',
    single:true,
    filename:false,
    min: 0,
    max: .5,
    reverse:false,
    count:15
  }

  // add Freesound[5] notation...
  for( let i = 0; i < 20; i++ ) {
    Freesound[ i ] = function( ...args ) {
      if( args.length > 0 ) {
        if( typeof args[0] === 'string' ) {
          if( args.length > 1 ) {
            if( typeof args[1] === 'object' ) {
              args[1].maxVoices = i || 1
            } 
          }else{
            args[1] = { maxVoices:i || 1 }
          }
        }else if( typeof args[0] === 'object' ) {
          args[0].maxVoices = i || 1
        }
      }else{
        args[0] = { maxVoices:i || 1 }
      } 

      return Freesound( ...args ) 
    }
  }

  const queries = {
    number( id, sampler, num=0 ) {
      if (typeof Freesound.loaded[ id ] === 'undefined') {
        fetch( `https://freesound.org/apiv2/sounds/${id}/?&format=json&token=${token}` )
          .then( response => response.json() )
          .then( json => {
            const path = json.previews[ 'preview-hq-mp3' ]
            
            //sampler.loadSample( path )
            sampler.loadSample( path, (__sampler,buffer) => {
              Freesound.loaded[ id ] = buffer.data.buffer
            })

            console.log( 'freesound now loading:', path )
          }) 
      }else{
        if( Audio.Gibberish.mode === 'worklet' ) {
          console.log( 'reusing loaded freesound:', path )
          sampler.loadSample( id, null, Freesound.loaded[ id ] )
        }
      }
    },

    // search for text query, and then use returned id to 
    // fetch by number 
    string( query, sampler, count, originalQuery ) {
      sampler.length = count
      let queryString ='https://freesound.org/apiv2/search/text/?'

      console.group('Querying Freesound for: ' + originalQuery || query )
      if( query.indexOf( 'query' ) > -1 ) {
        queryString += query
        queryString += `&token=${token}&fields=name,id,previews,username,license&page_size=${count} `
      }else{
        queryString += `query=${query}&token=${token}&fields=name,id,previews,username,license&filter=original_filename:${query.split(' ')[0]} ac_single_event:true&sort=downloads_desc&page_size=${count}`

      }

      fetch( queryString )
        .then( data => data.json() )
        .then( sounds => {
          if( sounds.results.length > 0 ) {
            if( sounds.results.length > count ) sounds.results = sounds.results.slice(0,count)
            console.log(`%c${sounds.results.length} sounds found. Starting downloads:`, `background:black;color:white`)
          }else{
            console.log(`%cNo sounds were found for this query!`, `background:red;color:white`)
          }
          sampler.length = count < sounds.results.length ? count : sounds.results.length
          console.table( sounds.results.map( r=>({file:r.name, id:r.id, author:r.username,license:'CC/'+r.license.split('/').slice(4).join('/') }) ) )
          for( let i = 0; i < sampler.length; i++ ) {
            const result = sounds.results[i]
            if( result !== undefined ) {
              const filename = result.name,
                    id = result.id,
                    url = result.previews[ 'preview-hq-mp3' ] 

              if( Freesound.loaded[ url ] === undefined ) {
                //console.log( `%c${filename}`, `color:white;background:#333333;` )

                sampler.loadSample( url, (__sampler,buffer) => {
                  Freesound.loaded[ url ] = buffer.data.buffer
                })

              }else{
                // XXX memoing the files causes an error
                if( Gibberish.mode === 'worklet' ) {
                  //console.log( 'reusing freesound file:', filename )
                  sampler.loadSample( url, null, Freesound.loaded[ url ] )
                }
              }
            }
          }
          console.groupEnd()
        })
    },

    object( queryObj, sampler ) {
      const q = Object.assign( {}, Freesound.defaults, queryObj )
 
      let query = `query=${q.query}&format=json`
  
      query += `&filter=duration:[${q.min} TO ${q.max}]`
      if( q.single ) query += ` ac_single_event:true`
      if( q.filename ) query += ` original_filename:${q.query}`

      let sort = q.sort

      // user error check
      if( sort === 'ratings' ) sort = 'rating'

      sort += q.reverse ? '_asc' : '_desc'

      query += `&sort=${sort}`

      queries.string( query, sampler, q.count, q.query )
    }
  }

  return Freesound
}
