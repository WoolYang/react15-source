'use strict';
/**
********************对象池****************************
  单例模式是限制了一个类只能有一个实例，对象池模式则是限制一个类实例的个数。
  对象池类就像是一个对象管理员，它以Static列表（也就是装对象的池子）的形式存存储某个实例数受限的类的实例，每一个实例还要加一个标记，标记该实例是否被占用。
  当类初始化的时候，这个对象池就被初始化了，实例就被创建出来。
  然后，用户可以向这个类索取实例，如果池中所有的实例都已经被占用了，那么抛出异常。
  用户用完以后，还要把实例“还”回来，即释放占用。对象池类的成员应该都是静态的。
  用户也不应该能访问池子里装着的对象的构造函数，以防用户绕开对象池创建实例。书上说这个模式会用在数据库连接的管理上。
  比如，每个用户的连接数是有限的，这样每个连接就是一个池子里的一个对象，“连接池”类就可以控制连接数了。
 */
/**
  静态对象池。 每个可能的参数数量的几个自定义版本。 
  一个完全通用的pooler很容易实现，但需要访问`arguments`对象。
  在每一个中，`this`指的是Class本身，而不是实例。 
  如果需要其他任何其他内容，只需在此处或在自己的文件中添加。
 */
var oneArgumentPooler = function (copyFieldsFrom) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, copyFieldsFrom);
    return instance;
  } else {
    return new Klass(copyFieldsFrom);
  }
};

var twoArgumentPooler = function (a1, a2) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2);
    return instance;
  } else {
    return new Klass(a1, a2);
  }
};

var threeArgumentPooler = function (a1, a2, a3) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3);
    return instance;
  } else {
    return new Klass(a1, a2, a3);
  }
};

var fourArgumentPooler = function (a1, a2, a3, a4) {
  var Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop();
    Klass.call(instance, a1, a2, a3, a4);
    return instance;
  } else {
    return new Klass(a1, a2, a3, a4);
  }
};

var standardReleaser = function (instance) {
  var Klass = this;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

var DEFAULT_POOL_SIZE = 10;
var DEFAULT_POOLER = oneArgumentPooler;

/**
 * Augments `CopyConstructor` to be a poolable class, augmenting only the class
 * itself (statically) not adding any prototypical fields. Any CopyConstructor
 * you give this may have a `poolSize` property, and will look for a
 * prototypical `destructor` on instances.
 *
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
var addPoolingTo = function (CopyConstructor, pooler) {
  // Casting as any so that flow ignores the actual implementation and trusts
  // it to match the type we declared
  var NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = pooler || DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

var PooledClass = {
  addPoolingTo: addPoolingTo,
  oneArgumentPooler: oneArgumentPooler,
  twoArgumentPooler: twoArgumentPooler,
  threeArgumentPooler: threeArgumentPooler,
  fourArgumentPooler: fourArgumentPooler
};

module.exports = PooledClass;