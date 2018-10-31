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

//任意参数
const argumentPooler = function (...args) {
  const Klass = this;
  if (Klass.instancePool.length) {
    var instance = Klass.instancePool.pop(); //从对象池取出一个实例
    Klass.call(instance, ...args); //将参数赋给实例
    return instance;
  } else {
    return new Klass(...args); 
  }
};

//释放资源
const standardReleaser = function (instance) {
  const Klass = this;
  instance.destructor();
  if (Klass.instancePool.length < Klass.poolSize) {
    Klass.instancePool.push(instance);
  }
};

// 默认值
const DEFAULT_POOL_SIZE = 10;
const DEFAULT_POOLER = argumentPooler;

/**
 * @param {Function} CopyConstructor Constructor that can be used to reset.
 * @param {Function} pooler Customizable pooler.
 */
const addPoolingTo = function (CopyConstructor) {
  const NewKlass = CopyConstructor;
  NewKlass.instancePool = [];
  NewKlass.getPooled = DEFAULT_POOLER;
  if (!NewKlass.poolSize) {
    NewKlass.poolSize = DEFAULT_POOL_SIZE;
  }
  NewKlass.release = standardReleaser;
  return NewKlass;
};

const PooledClass = {
  addPoolingTo: addPoolingTo
};

module.exports = PooledClass;