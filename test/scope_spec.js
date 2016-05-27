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
    it("never executes $applyAsync'ed function in the same cycle", function(done) {
      scope.aValue = [1, 2, 3];
      scope.asyncApplied = false;
      scope.$watch(
        function(){return scope.aValue},
        function (newValue,oldValue,scope) {
          scope.$applyAsync(function () {
            scope.asyncApplied=true;
          });
        });
      scope.$digest();
      expect(scope.asyncApplied).toBe(false);
      setTimeout(function (){
        expect(scope.asyncApplied).toBe(true);
        done();
      },50);
    });

      it('allows async $apply with $applyAsync', function(done) {
      scope.counter = 0;
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      expect(scope.counter).toBe(1);
      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it("schedules a digest in $evalAsync",function(done){
       scope.name="abc";
       scope.counter=0;
       scope.$watch(
         function(scope){return scope.name;},
         function(newValue,oldValue,scope){
           scope.counter++;
         });
      scope.$evalAsync(function (scope) {});
      expect(scope.counter).toBe(0);
      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it("has a $$phase field whose value is the current digest phase",function(){
      scope.aValue = [1, 2, 3];
      scope.phaseInWatchFunction = undefined;
      scope.phaseInListenerFunction = undefined;
      scope.phaseInApplyFunction = undefined;
      scope.$watch(
        function (scope) {
          scope.phaseInWatchFunction=scope.$$phase;
          return scope.aValue;
        },
        function(newValue,oldValue,scope){
          scope.phaseInListenerFunction=scope.$$phase;
        });

     scope.$apply(function() {
       scope.phaseInApplyFunction=scope.$$phase;
     });
     expect(scope.phaseInWatchFunction).toBe('$digest');
     expect(scope.phaseInListenerFunction).toBe('$digest');
     expect(scope.phaseInApplyFunction).toBe('$apply');
   });
    it("eventually halts $evalAsyncs added by watches",function() {
      scope.aValue = [1, 2, 3];
      scope.$watch(
        function(scope) {
          scope.$evalAsync(function(scope) { });
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );
      expect(function() { scope.$digest(); }).toThrow();
    });

    it("executes $evalAsync'ed functions even when not dirty", function() {
      scope.aValue = [1, 2, 3];
      scope.asyncEvaluatedTimes = 0;
      scope.$watch(
        function(scope) {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(function(scope) {
              scope.asyncEvaluatedTimes++;
            });
          }
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );
      scope.$digest();
      expect(scope.asyncEvaluatedTimes).toBe(2);
    });

    it("executes $evalAsync'ed functions added by watch functions",function(){
      scope.aValue=[1,2,3];
      scope.asyncEvaluated=false;
      scope.$watch(
        function(scope){
          if(!scope.asyncEvaluated){
            scope.$evalAsync(function(scope){
              scope.asyncEvaluated=true;
            });
          }
          return scope.aValue;
        },
        function(newValue,oldValue,scope){}
      );
      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
    });
    it("executes $evalAsync'ed function later in the same cycle",function () {
      scope.aValue=[1,2,3];
      scope.asyncEvaluated = false;
      scope.asyncEvaluatedImmediately = false;
      scope.$watch(
        function(scope){return scope.aValue;},
        function(newValue,oldValue,scope){
          scope.$evalAsync(function(){
            scope.asyncEvaluated=true;
          });
          scope.asyncEvaluatedImmediately=scope.asyncEvaluated;
        });

      scope.$digest();
      expect(scope.asyncEvaluated).toBe(true);
      expect(scope.asyncEvaluatedImmediately).toBe(false);

    })

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
    it("triggers chained watchers in the same digest",function () {
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
    });


  });
});
