const o = require('ospec')
const {read, Env} = require('solarjs')

process.env.TEST_CONFIG_VAR = '10'

o.spec('[config] read', function () {
  o('read', function () {
    o(read('TEST_CONFIG_VAR')).equals('10')
  })

  o('read throws', function () {
    o(() => read('I_DONT_EXIST__1')).throws('[config] Please set I_DONT_EXIST__1')
  })

  o('read default & set', function () {
    o(read('I_DONT_EXIST__2', '123')).equals('123')
    o(read('I_DONT_EXIST__2')).equals('123')
  })

  o('read empty string', function () {
    o(read('I_DONT_EXIST__3', '')).equals('')
  })

  o('read default bad type', function () {
    o(() => read('I_DONT_EXIST__4', 123)).throws('[config] Default value must be a string')
  })

  o('read conversion', function () {
    o(read('TEST_CONFIG_VAR', Number)).equals(10)
  })

  o('read default conversion & set', function () {
    o(read('I_DONT_EXIST__5', '123', Number)).equals(123)
    o(read('I_DONT_EXIST__5')).equals('123')
  })
})

o.spec('[config] env.branch', function () {
  o('choose', function () {
    process.env.NODE_ENV = 'two'
    const env = Env(['one', 'two'])
    const choice = env.branch({
      one: 1,
      two: 2,
    })
    o(choice).equals(2)
  })

  o('choose default', function () {
    process.env.NODE_ENV = 'three'
    const env = Env(['one', 'two', 'three'])
    const choice = env.branch({ x: 10 }, {
      one: 1,
      two: 2,
    })
    o(choice).deepEquals({ x: 10 })
  })

  o('choose default function', function () {
    process.env.NODE_ENV = 'three'
    const env = Env(['one', 'two', 'three'])
    const choice = env.branch(() => [true, 10], {
      one: 1,
      two: 2,
    })
    o(choice).deepEquals([true, 10])
  })

  o('choose default specified', function () {
    process.env.NODE_ENV = 'one'
    const env = Env(['one', 'two', 'three'])
    const choice = env.branch([true, 10], {
      one: 1,
      two: 2,
    })
    o(choice).equals(1)
  })

  o('choose default specified function', function () {
    process.env.NODE_ENV = 'one'
    const env = Env(['one', 'two', 'three'])
    const choice = env.branch([true, 10], {
      one: () => 11,
      two: 2,
    })
    o(choice).equals(11)
  })
})
