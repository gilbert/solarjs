import {route} from '../route'

export default {
  home: route('/'),
  user: route('/users/:username', { username: 'str' }),

  entry: route('/entry/:name', { name: 'str' })
}
