function Scope(){
  'use strict';
  this.$$watchers=[];
  this.$$lastDirtyWatch=null;
  this.$$asyncQueue=[];
  this.$$applyAsyncQueue=[];
  this.$$phase=null;
}
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

Scope.prototype.$applyAsync=function (expr) {
  var self=this;
  self.$$applyAsyncQueue.push(function () {
    self.$eval(expr);
  });
  setTimeout(function () {
    self.$apply(function () {
      while(self.$$applyAsyncQueue.length){
        self.$$applyAsyncQueue.shift()();
      }
    });
  },0);
};

Scope.prototype.$watch=function (watchFn,listenerFn,valueEq) {
  'use strict';
  var watcher={
    watchFn:watchFn,
    listenerFn:listenerFn || function () { },
    valueEq:!!valueEq,
    last:initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch=null;
};

Scope.prototype.$eval = function(expr, locals) {
   return expr(this, locals);
};

Scope.prototype.$apply=function (expr) {
  try{
    this.$beginPhase("$apply");
    this.$eval(expr);
  }finally{
    this.$clearPhase();
    this.$digest();
  }
};

Scope.prototype.$evalAsync=function (expr) {
  var self=this;
  if(!self.$$phase&&!self.$$asyncQueue.length){
    setTimeout(function () {
      if(self.$$asyncQueue.length){
        self.$digest();
      }
    });
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

Scope.prototype.$$digestOnce=function () {
  'use strict';
  var self=this;
  var newValue,oldValue,dirty;
  _.forEach(this.$$watchers,function(watcher){
    newValue=watcher.watchFn(self);
    oldValue=watcher.last;
    if(!self.$$areEqual(newValue,oldValue,watcher.valueEq)){
      self.$$lastDirtyWatch=watcher;
      watcher.last=(watcher.valueEq ? _.cloneDeep(newValue):newValue);
      watcher.listenerFn(newValue,(oldValue===initWatchVal?newValue:oldValue),self);
      dirty=true;
    }else if(self.$$lastDirtyWatch===watcher){
      return false;
    }
  });
  return dirty;
};

Scope.prototype.$digest=function () {
  var dirty; var TTL=10;
  this.$$lastDirtyWatch=null;
  this.$beginPhase("$digest");
  do{
    while(this.$$asyncQueue.length){
      var asyncTask=this.$$asyncQueue.shift();
      asyncTask.scope.$eval(asyncTask.expression);
    }
    dirty=this.$$digestOnce();
    if((dirty ||  this.$$asyncQueue.length) && !(TTL--)){
      this.$clearPhase();
      throw "10 digest iterations reached";
    }
  }while (dirty || this.$$asyncQueue.length);
  this.$clearPhase();
};
