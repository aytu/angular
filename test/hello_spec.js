describe("Hello",function () {
  'use strict';
  it("says hello to receiver",function () {
    expect(sayHello('Jane')).toBe("Hello, Jane!");
  });
});
