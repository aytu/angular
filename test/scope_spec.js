describe("Scope",function () {
  'use strict';
  it("can be constructed and used as an object",function () {
    var scope=new Scope();
    scope.aProperty=1;
    expect(scope.aProperty).toBe(1);
  });

  describe("Digest",function () {
    var scope;

    beforeEach(function () {
      scope=new Scope();
    });
    it("executes $apply'ed function and starts the digest",function () {
        scope.name="Jhon";
        scope.count=0;
        scope.$watch(
          function(scope){return scope.name;},
          function(newValue,oldValue,scope){
            scope.count++;
          }
        );
        scope.$digest();
        expect(scope.count).toBe(1);
        scope.$apply(function(){scope.name="someone";});
        expect(scope.count).toBe(2);
    })
    it("executes $eval'ed function and returns result", function() {
      scope.aValue = 42;
      var result = scope.$eval(function(scope) {
        return scope.aValue;
      });
      expect(result).toBe(42);
    });
    it("NaN",function () {
      scope.num=0/0;
      scope.counter=0;
      scope.$watch(
        function(scope){return scope.num;},
        function(newValue,oldValue,scope){
          scope.counter++;
        });
        scope.$digest();
        expect(scope.counter).toBe(1);
        scope.$digest();
        expect(scope.counter).toBe(1);
    });

    it("compares based on value if enabled",function () {
        scope.aValue=[2,3,4];
        scope.counter=0;
        scope.$watch(
          function (scope) { return scope.aValue;},
          function (newValue,oldValue,scope) {
            scope.counter++;
          },true);

        scope.$digest();
        expect(scope.counter).toBe(1);
        scope.aValue.push(7);
        scope.$digest();
        expect(scope.counter).toBe(2);
    })
    it("does not end digest so that new watches are not run",function () {
      scope.name="abc";
      scope.count=0;
      scope.$watch(
        function (scope) {
          return scope.name;
        },
        function (newValue,oldValue,scope) {
          scope.$watch(
            function (scope) { return scope.name; },
            function (newValue,oldValue,scope) {
              scope.count++;
            });
        });
      scope.$digest();
      expect(scope.count).toBe(1);
    });

    it("ends the digest when the last watch is clean",function () {
      scope.array = _.range(100);
      var watchExecutions = 0;
      _.times(100,function (i) {
        scope.$watch(
          function (scope) { watchExecutions++; return scope.array[i];  },
          function (newValue,oldValue,scope) { }
        );
      });

      scope.$digest();
      expect(watchExecutions).toBe(200);
      scope.array[3]=22;
      scope.$digest();
      expect(watchExecutions).toBe(304);
    });
    /*it("triggers chained watchers in the same digest",function () {
      scope.name="Jane";
      scope.$watch(
        function (scope) {return scope.nameUpper;},
        function (newValue,oldValue,scope) {
          if(newValue){
            scope.initial=newValue.substring(0,1)+".";
          }
        });
      scope.$watch(
        function (scope) {return scope.name;},
        function (newValue,oldValue,scope) {
          if(newValue){
            scope.nameUpper=newValue.toUpperCase();
          }
        });
        scope.$digest();
        expect(scope.initial).toBe('J.');
        scope.name="Bob";
        scope.$digest();
        expect(scope.initial).toBe('B.');
    });*/


  });
});
