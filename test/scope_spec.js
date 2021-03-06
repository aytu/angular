describe("Scope",function () {
  'use strict';
  it("can be constructed and used as an object",function () {
    var scope=new Scope();
    scope.aProperty=1;
    expect(scope.aProperty).toBe(1);
  });

  describe('inheritance',function(){
    it("executes $$postDigest functions on isolated scopes", function() {
      var parent = new Scope();
      var child = parent.$new(true);
      child.$$postDigest(function() {
        child.didPostDigest = true;
      });
      parent.$digest();
      expect(child.didPostDigest).toBe(true);
    });
    it("executes $evalAsync functions on isolated scopes", function(done) {
      var parent = new Scope();
      var child = parent.$new(true);
      child.$evalAsync(function(scope) {
        scope.didEvalAsync = true;
      });
      setTimeout(function() {
        expect(child.didEvalAsync).toBe(true);
        done();
      }, 50);
    });
    it("schedules a digest from root on $evalAsync when isolated", function(done) {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();
      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      child2.$evalAsync(function(scope) { });
      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });
    it("digests from root on $apply when isolated", function() {
      var parent = new Scope();
      var child = parent.$new(true);
      var child2 = child.$new();
      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      child2.$apply(function(scope) { });
      expect(parent.counter).toBe(1);
    });
    it("digests its isolated children", function() {
      var parent = new Scope();
      var child = parent.$new(true);
      child.aValue = 'abc';
      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );
      parent.$digest();
      expect(child.aValueWas).toBe('abc');
    });
    it("cannot watch parent attributes when isolated", function() {
      var parent = new Scope();
      var child = parent.$new(true);
      parent.aValue = 'abc';
      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );
      child.$digest();
      expect(child.aValueWas).toBeUndefined();
    });
    it("does not have access to parent attributes when isolated",function () {
      var parent=new Scope();
      var child=parent.$new(true);
      parent.avalue="abc";
      expect(child.avalue).toBeUndefined();
    });
    it("schedules a digest from root on $evalAsync", function(done) {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();
      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      child2.$evalAsync(function(scope) { });
      setTimeout(function() {
        expect(parent.counter).toBe(1);
        done();
      }, 50);
    });

    it("digests from root on $apply", function() {
      var parent = new Scope();
      var child = parent.$new();
      var child2 = child.$new();
      parent.aValue = 'abc';
      parent.counter = 0;
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      child2.$apply(function(scope) { });
      expect(parent.counter).toBe(1);
    });
    it("digests its children", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.aValue = 'abc';
      child.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );
      parent.$digest();
      expect(child.aValueWas).toBe('abc');
    });

    it("keeps a record of its children", function() {
      var parent = new Scope();
      var child1 = parent.$new();
      var child2 = parent.$new();
      var child2_1 = child2.$new();
      expect(parent.$$children.length).toBe(2);
      expect(parent.$$children[0]).toBe(child1);
      expect(parent.$$children[1]).toBe(child2);
      expect(child1.$$children.length).toBe(0);
      expect(child2.$$children.length).toBe(1);
      expect(child2.$$children[0]).toBe(child2_1);
    });

    it("does not digest its parent(s)", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.aValue = 'abc';
      parent.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.aValueWas = newValue;
        }
      );
      child.$digest();
      expect(child.aValueWas).toBeUndefined();
    });

    it("shadows a parent's property with the same name", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.name = 'Joe';
      child.name = 'Jill';
      expect(child.name).toBe('Jill');
      expect(parent.name).toBe('Joe');
    });
    it("does not shadow members of parent scope's attributes",function () {
      var parent=new Scope();
      var child=parent.$new();
      parent.user={name:"Joe"};
      child.user.name="Bill";
      expect(child.user.name).toBe("Bill");
      expect(parent.user.name).toBe("Bill");
    });
    it("inherits the parent's properties",function(){
      var parent=new Scope();
      parent.avalue=[1,2,3];
      var child=parent.$new();
      expect(child.avalue).toEqual([1,2,3]);
    })

    it("does not cause a parent to inherit its properties", function() {
      var parent = new Scope();
      var child = parent.$new();
      child.aValue = [1, 2, 3];
      expect(parent.aValue).toBeUndefined();
    });

    it("inherits the parent's properties whenever they are defined", function() {
      var parent = new Scope();
      var child = parent.$new();
      parent.aValue = [1, 2, 3];
      expect(child.aValue).toEqual([1, 2, 3]);
    });

    it("can manipulate a parent scope's property", function() {
      var parent=new Scope();
      parent.avalue=[1,2,3];
      var child=parent.$new();
      child.avalue.push(4);
      expect(child.avalue).toEqual([1,2,3,4]);
      expect(child.avalue).toEqual([1,2,3,4]);
    });
    it("can watch a property in the parent",function(){
         var parent=new Scope();
         var child=parent.$new();
         parent.avalue=[1,2,3];
         child.counter=0;
         child.$watch(function (scope) {
           return scope.avalue;
         },function (newValue,oldValue,scope) {
           scope.counter++;
         },true);
         child.$digest();
         expect(child.counter).toBe(1);
         parent.avalue.push(4);
         child.$digest();
         expect(child.counter).toBe(2);
    });
    it("can be nested at any depth",function () {
      var a=new Scope();
      var aa=a.$new();
      var aaa=aa.$new();
      var ab=a.$new();
      var aab=aa.$new();
      var abb=ab.$new();
      a.value=1;
      expect(aa.value).toBe(1);
      expect(aaa.value).toBe(1);
      expect(ab.value).toBe(1);
      expect(aab.value).toBe(1);
      expect(abb.value).toBe(1);
      ab.anotherValue = 2;
      expect(abb.anotherValue).toBe(2);
      expect(aa.anotherValue).toBeUndefined();
      expect(aaa.anotherValue).toBeUndefined();
    });

  });



  describe('$watchGroup', function() {
    var scope;

    beforeEach(function () {
      scope=new Scope();
    });
    it('takes watches as an array and calls listener with arrays', function() {
        var gotNewValues, gotOldValues;
        scope.aValue=1;
        scope.anotherValue=2;
        scope.$watchGroup([
          function(scope){return scope.aValue;},
          function(scope){return scope.anotherValue;}
        ],function (newValues,oldValues,scope) {
          gotNewValues=newValues;
          gotOldValues=oldValues;
        });
        scope.$digest();
        expect(gotNewValues).toEqual([1, 2]);
        expect(gotOldValues).toEqual([1, 2]);
    });
  });

  describe("Digest",function () {
    var scope;

    beforeEach(function () {
      scope=new Scope();
    });
    it("allows destroying several $watches during digest", function() {
      scope.aValue = 'abc';
      scope.counter = 0;
      var destroyWatch1 = scope.$watch(
        function(scope) {
          destroyWatch1();
          destroyWatch2();
        }
      );
      var destroyWatch2 = scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(0);
    });
    it("allows a $watch to destroy another during digest", function() {
      scope.aValue = 'abc';
      scope.counter = 0;
      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          destroyWatch();
        }
      );
      var destroyWatch = scope.$watch(
        function(scope) { },
        function(newValue, oldValue, scope) { }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });


    it("allows destroying a $watch during digest", function() {
      scope.aValue = 'abc';
      var watchCalls = [];
      scope.$watch(
        function(scope) {
          watchCalls.push('first');
          return scope.aValue;
        }
      );
      var destroyWatch = scope.$watch(
        function(scope) {
          watchCalls.push('second');
          destroyWatch();
        }
      );
      scope.$watch(
        function(scope) {
          watchCalls.push('third');
          return scope.aValue;
        }
      );
      scope.$digest();
      expect(watchCalls).toEqual(['first', 'second', 'third', 'first', 'third']);
    });

    it("allows destroying a $watch with a removal function",function () {
      scope.aValue="sd";
      scope.counter=0;
      var destroyWatch=scope.$watch(
        function(scope){return scope.aValue;},
        function(newValue,oldValue,scope){
          scope.counter++;
        });
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.aValue="abc";
      scope.$digest();
      expect(scope.counter).toBe(2);
      scope.aValue = 'ghi';
      destroyWatch();
      scope.$digest();
      expect(scope.counter).toBe(2);
    });

    it("catches exceptions in $$postDigest", function() {
      var didRun = false;
      scope.$$postDigest(function() {
        throw "Error";
      });
      scope.$$postDigest(function() {
        didRun = true;
      });
      scope.$digest();
      expect(didRun).toBe(true);
    });

    it("catches exceptions in $applyAsync", function(done) {
      scope.$applyAsync(function(scope) {
        throw "Error";
      });
      scope.$applyAsync(function(scope) {
        throw "Error";
      });
      scope.$applyAsync(function(scope) {
        scope.applied = true;
      });
      setTimeout(function() {
        expect(scope.applied).toBe(true);
        done();
      }, 50);
    });
    it("catches exceptions in $evalAsync", function(done) {
      scope.aValue = 'abc';
      scope.counter = 0;
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$evalAsync(function(scope) {
        throw "Error";
      });
      setTimeout(function() {
        expect(scope.counter).toBe(1);
        done();
      }, 50);
    });

    it("catches exceptions in listener functions and continues", function() {
      scope.aValue = 'abc';
      scope.counter = 0;
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          throw "Error";
        }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it("catches exceptions in watch functions and continues", function() {
      scope.aValue = 'abc';
      scope.counter = 0;
      scope.$watch(
        function(scope) { throw "error"; },
        function(newValue, oldValue, scope) { }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });
    it("catches exceptions in watch functions and continues", function() {
      scope.aValue = 'abc';
      scope.counter = 0;
      scope.$watch(
        function(scope) { throw "error"; },
        function(newValue, oldValue, scope) { }
      );
      scope.$watch(
        function(scope) { return scope.aValue; },
        function(newValue, oldValue, scope) {
          scope.counter++;
        }
      );
      scope.$digest();
      expect(scope.counter).toBe(1);
    });
    it("does not include $$postDigest in the digest", function() {
      scope.aValue = 'original value';
      scope.$$postDigest(function() {
        scope.aValue = 'changed value';
      });
      scope.$watch(
        function(scope) {
          return scope.aValue;
        },
        function(newValue, oldValue, scope) {
          scope.watchedValue = newValue;
        }
      );
      scope.$digest();
      expect(scope.watchedValue).toBe('original value');
      scope.$digest();
      expect(scope.watchedValue).toBe('changed value');
    });

    it("runs a $$postDigest function after each digest", function() {
      scope.counter = 0;
      scope.$$postDigest(function() {
        scope.counter++;
      });
      expect(scope.counter).toBe(0);
      scope.$digest();
      expect(scope.counter).toBe(1);
      scope.$digest();
      expect(scope.counter).toBe(1);
    });

    it('cancels and flushes $applyAsync if digested first', function(done) {
      scope.counter = 0;
      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.aValue;
        },
        function(newValue, oldValue, scope) { }
      );
      scope.$applyAsync(function(scope) {
        scope.aValue = 'abc';
      });
      scope.$applyAsync(function(scope) {
        scope.aValue = 'def';
      });
      scope.$digest();
      expect(scope.counter).toBe(2);
      expect(scope.aValue).toEqual('def');
      setTimeout(function() {
        expect(scope.counter).toBe(2);
        done();
      }, 50);
    });

    it("coalesces many calls to $applyAsync",function (done) {
      scope.name="abc";
      scope.counter=0;
      scope.lisenerCount=0;
      scope.$watch(
        function(scope) {
          scope.counter++;
          return scope.name;
        },
        function(newValue,oldValue,scope){
          scope.lisenerCount++;
        });
      scope.$applyAsync(function(){
        scope.name="def";
      });
      scope.$applyAsync(function(){
        scope.name="shd";
      });
      setTimeout(function () {
        expect(scope.counter).toBe(2);
        expect(scope.lisenerCount).toBe(1);
        done();
      },50);
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
