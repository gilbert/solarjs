// import phin from 'phin'

// export function makeRpcClient<T>(endpoint: string) {
//   return new Proxy({}, {
//     get(_, procName: string) {
//       return async (args: any) => {
//         const response = await phin({
//           url: `${endpoint}/${procName}`,
//           method: 'POST',
//           data: args,
//           parse: 'json',
//         })
//         return response.body
//       }
//     }
//   }) as T
// }
