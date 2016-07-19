function Scope(){
  'use strict';
  this.$$watchers=[];
  this.$$lastDirtyWatch=null;
  this.$$asyncQueue=[];
  this.$$applyAsyncQueue=[];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$root=this;
  this.$$phase=null;
  this.$$children=[];
}
Scope.prototype.$new=function (isolated) {
  var child;
  if(isolated){
    child=new Scope();
    child.$root=this.$root;
    child.$$asyncQueue=this.$$asyncQueue;
    child.$$postDigestQueue=this.$$postDigestQueue;
    child.$$applyAsyncQueue = this.$$applyAsyncQueue;
  }
  else {
     child= Object.create(this);
  }
  this.$$children.push(child);
  child.$$watchers=[];
  child.$$children=[];
  return child;
};
Scope.prototype.$$postDigest = function(fn) {
  this.$$postDigestQueue.push(fn);
};

Scope.prototype.$beginPhase=function (phase) {
  if(this.$$phase){
    throw this.$$phase + ' already in progress.';
  }
  this.$$phase=phase;
};
Scope.prototype.$clearPhase=function(){
  this.$$phase=null;
};
function initWatchVal() { }

Scope.prototype.$$flushApplyAsync=function () {
  while (this.$$applyAsyncQueue.length) {
    try{
        this.$$applyAsyncQueue.shift()();
    }catch(e){
      console.log(e);
    }
  }
  this.$root.$$applyAsyncId = null;
};

Scope.prototype.$applyAsync=function (expr) {
  var self=this;
  self.$$applyAsyncQueue.push(function () {
    self.$eval(expr);
  });
  if(self.$root.$$applyAsyncId===null){
    self.$root.$$applyAsyncId=setTimeout(function () {
      self.$apply(_.bind(self.$$flushApplyAsync, self));
    },0);
  }

};
Scope.prototype.$watchGroup=function(watchFns,listenerFn){
  var self = this;
  var newValues = new Array(watchFns.length);
  var oldValues = new Array(watchFns.length);
  _.forEach(watchFns, function(watchFn, i) {
    self.$watch(watchFn, function(newValue, oldValue) {
      newValues[i] = newValue;
      oldValues[i] = oldValue;
      listenerFn(newValues, oldValues, self);
    });
  });
};
Scope.prototype.$watch=function (watchFn,listenerFn,valueEq) {
  'use strict';
  var self=this;
  var watcher={
    watchFn:watchFn,
    listenerFn:listenerFn || function () { },
    valueEq:!!valueEq,
    last:initWatchVal
  };
  this.$$watchers.unshift(watcher);
  this.$root.$$lastDirtyWatch=null;
  return function(){
    var index=self.$$watchers.indexOf(watcher);
    if(index>=0){
      self.$$watchers.splice(index,1);
      self.$root.$$lastDirtyWatch = null;
    }
  };
};

Scope.prototype.$eval = function(expr, locals) {
  return expr(this, locals);
};

Scope.prototype.$apply=function (expr) {
  try{
    this.$beginPhase("$apply");
    return this.$eval(expr);
  }finally{
    this.$clearPhase();
    this.$root.$digest();
  }
};

Scope.prototype.$evalAsync=function (expr) {
  var self=this;
  if(!self.$$phase&&!self.$$asyncQueue.length){
    setTimeout(function () {
      if(self.$$asyncQueue.length){
        self.$root.$digest();
      }
    },0);
  }
  this.$$asyncQueue.push({scope:this,expression:expr});
};

Scope.prototype.$$areEqual=function (newValue,oldValue,valueEq) {
  if(valueEq){
    return _.isEqual(newValue,oldValue);
  }else{
    return newValue===oldValue || (typeof newValue==='number'&& typeof oldValue==='number'&& isNaN(newValue)&&isNaN(oldValue));
  }
};
Scope.prototype.$$everyScope = function(fn) {
  if (fn(this)) {
    return this.$$children.every(function(child) {
      return child.$$everyScope(fn);
    });
  } else {
    return false;
  }
};
Scope.prototype.$$digestOnce=function () {
  'use strict';
  var dirty;
  var continueLoop = true;
  var self=this;

  this.$$everyScope(function (scope) {
    var newValue,oldValue;
    _.forEachRight(scope.$$watchers,function(watcher){
      if(watcher){
        try{
          newValue=watcher.watchFn(scope);
          oldValue=watcher.last;
          if(!scope.$$areEqual(newValue,oldValue,watcher.valueEq)){
            self.$root.$$lastDirtyWatch=watcher;
            watcher.last=(watcher.valueEq ? _.cloneDeep(newValue):newValue);
            watcher.listenerFn(newValue,(oldValue===initWatchVal?newValue:oldValue),scope);
            dirty=true;
          }else if(self.$root.$$lastDirtyWatch===watcher){
            continueLoop=false;
            return false;
          }
        }catch(e){
          console.log(e);
        }
      }
    });
    return continueLoop;
  });
  return dirty;
};


Scope.prototype.$digest=function () {
  var dirty; var TTL=10;
  this.$root.$$lastDirtyWatch=null;
  this.$beginPhase("$digest");
  if (this.$root.$$applyAsyncId) {
      clearTimeout(this.$root.$$applyAsyncId);
      this.$$flushApplyAsync();
  }
  do{
      while(this.$$asyncQueue.length){
        try{
          var asyncTask=this.$$asyncQueue.shift();
          asyncTask.scope.$eval(asyncTask.expression);
         }catch(e){
            console.log(e);
          }
        }
    dirty=this.$$digestOnce();
    if((dirty ||  this.$$asyncQueue.length) && !(TTL--)){
      this.$clearPhase();
      throw "10 digest iterations reached";
    }
  }while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();

    while (this.$$postDigestQueue.length) {
      try{
         this.$$postDigestQueue.shift()();
      }catch(e){
       console.log(e);
     }
   }
};
