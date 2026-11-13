// Only anonymous, read-only endpoints opt into the public Pages origin.
export function publicCors(request){return request.headers.get('origin')==='https://betlemska.github.io'?{'Access-Control-Allow-Origin':'https://betlemska.github.io','Vary':'Origin'}:{}}
