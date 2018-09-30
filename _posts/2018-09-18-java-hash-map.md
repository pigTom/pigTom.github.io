---
layout: post
title: java HashMap 笔记
author: site.data.brume.author
date: 2018-09-18 23:09:30
---

# Hash Map 源代码详解

**以下是翻译**

    一般情况下这种Map的内部哈希表是桶(bin)方式实现的(所谓桶就是在同一个哈希表位上多个结点之间是以链表方式存储的)，
但变得太大时,桶就会转变成树结点(同一个哈希位上多个结点之间是以二叉树方式存储的。
这个结构与java.util.TreeMap中结构一致。大多数方法会优先使用桶，
但是当可以用树结点时，会将桶转变成树结点。树结点可以被遍历，用起来和普通的桶一样，
但是当桶过于密集时，树结点支持快速查找(fast-lookup)。因为大多数情况下桶不会过于密集，
所以在哈希表方法中检查树结点的存在会造成耗时。

	树结点主要以哈希值排序，当他们的哈希值相同时(被称作ties),会去判断树结点的key是否是这样的类
class C implements Comparable<C>,如果是则需要调用他们的compareTo方法去排序（会用反射去验证
是否满足上述条件）。树结点的新增操作在最坏情况下的时间复杂度是O(lgn)当树结点的key的哈希值相等
且key不能通过compareTo方法比较时，当hashCode()方法被意外地或者是恶意编程使得多个key具有相同的哈希值，
只要key是可以比较的，那么性能会优雅的下降（性能不会怎么变坏）。(如果这两个情况都不存在，我们会浪
费掉两倍的时间跟空间)

	因为树结点是普通桶的两倍大小，只有当桶中的桶过多时，我们才会把普通的桶转化为树结点，
当桶中的数量达到TREEIFY_THRESHOLD这个值时，才会转化。当由于删除操作
或者resize操作使得中的树结点太少时(see UNTREEIFY_THRESHOLD)，树结点会变成普通的桶. 当哈希值分布
良好时，bin会很少使用。在理想情况下，对于随机的哈希值，bins中的结点服从[泊松分布](http://en.wikipedia.org/wiki/Poisson_distribution)
,默认调整大小的参数是0.5，阈值是0.75，因为重新调整大小会导致方差的变化，但是忽略方差，列表k出现
的期望值是  (exp(-0.5) * pow(0.5, k) / factorial(k))

       0:    0.60653066
       1:    0.30326533
       2:    0.07581633
       3:    0.01263606
       4:    0.00157952
       5:    0.00015795
       6:    0.00001316
       7:    0.00000094
       8:    0.00000006
       more: less than 1 in ten million

	树的根结点通常是树结点中的第一个结点，有时候（通常发生在Iterator.remove删除了第一个结点），但是可以能过父结点
链接到根结点。（TreeNode.root()方法）
所有内部可用的方法接受一个哈希值作为参数（通常是用公用方法提供的），允许他们相互调用而不用重新计算哈希值，
大多数内部方法也接受一个参数*tab*,它通常就是HashMap里的*table*（哈希表），tab可能表示新哈希表也可能表示原哈希表，
因为哈希表重新调整大小，或者重新构造哈表都会导致哈希表变化。

## Hash Map 常量

    // 默认初始化大小16, 这个值必须是2的幂次方
    // 初始化大小可以被指定
    // 指的是Hash Table的大小
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    
    // 最大容量，给定的初始化大小必须比最大容量小
    // 如果给定的大小比最大容量大，初始化大小就取 1 << 30
    static final int MAXIMUM_CAPACITY = 1 << 30;
    
    // 默认的加载因子，当构造方法中没有指定时，加载因子大小设置为0.75
    // HashMap大小必须小于*LOAD_FACTOR * CAPACITY*
    static final float DEFAULT_LOAD_FACTOR = 0.75f;
     
	// 用来对桶计数的极限阈值，当桶的数量大于这个阈值时，应该将其转化为树而不是链表 
    static final int TREEIFY_THRESHOLD = 8;

	// 将树状的桶转化为链状桶的极限阈值，即当桶数量小于这个阈值时，桶要变成链状。
    static final int UNTREEIFY_THRESHOLD = 6
    
	// 桶可以变成树结点的最小哈希表容量
	// 为了避免在重新调整哈希表的大小和让桶变成树这两个操作矛盾
	// 这个值应该至少是*TREEIFY_THRESHOL*的四倍
    static final int MIN_TREEIFY_CAPACITY = 64;

## 字段
	// 哈希表，当分配大小后，它的长度总是二的幂次方
	// 当某些情况下我们也允许长度为零。
	transient Node<K,V>[] table;

	// 这个map中键值对的数量
	transient int size;

	// 这个HashMap结构变化次数，结构变化指的是键值对数量的改变或者table重新调整大小致内部结构的改变
	// 这个字段用来判断在迭代这个map时，map是否已经发生变化。
	transient int modCount;

	// 重新调整哈希表后，HashMap中能够装的键值对的对数（capacity * load factor）
	// 初始化时给定的哈希表大小(值必须是二的n次幂)
	// 或者初始化进默认哈希表大小*DEFAULT_INITIAL_CAPACITY
	int threshold;

	// 加载因子，一旦赋值就不能再改变
	final float loadFactor;
	
## 公共方法
	// get方法通过hash方法获得键的hash值，然后将hash值，和key传给getNode方法。
	public V get(Object key) { 
		Node<K,V) e;
		return (e = getNode(hash(key), key)) == null ? null : e.value;
	}

	// getNode是供get方法调用的，首先根据hash值找到key会映射到哪个哈希表中：算法是node = table[(length-1) & hash]
	// 找到对应的哈希表的bin了，以下主要有两种情况，bin可能是链表，也有可能是TreeNode(二叉树)。
	// 不过首先应该将bin的第一个（first)拿出来比较，虽然hash映射到哈希表中，但是这个哈希不一定相等，所以还要比较hash值。
	// 映射的条件是：哈希值相等，并且它们是相等的（==相等,或者相互equals),如果不相等证明它们不能映射,返回空。
	final Node<K,V> getNode(int hash, Object key) {
		Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
		if ((tab = table) != null && (n = tab.length) > 0 &&
			(first = tab[(n-1) & hash]) != null) { // hash算法： node = table[(length - 1) & hash]
			if (first.hash == hash && // always check first node
					((k = first.key) == key || (key != null && key.equals(k))))
					return first;
			if ((e = first.next) != null) {
				if (first instance of TreeNode) { // bin是树状结构，搜索树的遍历复杂度为lg(n)
					// 通过调用树的查询方法找出对应的结点
					return ((TreeNode<K,V>)first).getTreeNode(hash, key);
				}
				// 如果bin不是树状结构，那么它是链状结构，通过遍历链表查询关键字
				do {
					if (e.hash == hash &&
						   ((k = e.key) ==  key || (key != null && key.equals(key))))
								return e;
					e = e.next;
				} while(e != null)
			}
		}
		return null;
	}
	
	// 公有方法put(key,value), 插入键值对, 返回key对应哈希表中的原始值，如果不存在，返回空
	public V put(K key, V value){ return putVal(hash(key), key, value);}


