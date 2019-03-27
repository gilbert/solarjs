import {route} from 'solarjs/route'

export default {
  home: route('/'),
  user: route('/users/:username', { username: 'str' }),
}
