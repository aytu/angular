function sayHello(to) {
  'use strict';
  return _.template("Hello, <%= name %>!")({name: to});
}
