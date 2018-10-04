---
layout: post
title: java HashMap 笔记
subtitle: HashMap内部实现细节
author: site.data.brume.author
date: 2018-09-18 23:09:30
---

# Hash Map 概述

## 基本原理
&emsp;&emsp;
	HashMap是一种容器，用来存储数据的，字典中你可以通过索引找到你想找到的东西，在HashMap中，它是键值对(key-value)的形式，
就是一个键可以对应一个值，首先将某个键和值对存在HashMap中，然后就可以通过这个键(key)来找到的与之对应的值(value)，
HashMap的实现原理与字典很相似，实际上它是采用了散列表。
HashMap的内部原理就是[散列表](https://en.wikipedia.org/wiki/Hash_table)
，为了便于描述，我们将散列表中的位置叫做槽。每一个槽都有唯一的索引,我们把这个索引叫哈希索引，
我们可以通过哈希索引来找到唯一的槽，找到这个槽之后，还不一定找你要的值(value)，但是离找你想要的那个值不远了，
因为可能会有多个元素同时往这一个槽里挤，这种情况称之为冲突。怎么解决这个冲突呢，
在HashMap中会用[双向链表](https://en.wikipedia.org/wiki/Doubly_linked_list)
或者[红黑树](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree)来处理，槽里的元素叫桶，桶实现是双向链表，那么它就叫链桶，
否它就叫作树桶。
（冲突就是多个元素的键在散列表中都具有相同的哈希索引）。
双向链表的时间复杂度是*O(n)*,而红黑树的时间复杂度只有*O(lgn)*,红黑树的检索速度会快很多，
但是红黑树占用内存会是双向链表的两倍，所以只有在同一个槽内有很多冲突时，才会采用红黑树，而数量少会采用双向链表解决冲突。
那么不管是红黑树还是链表它们究竟是怎么样解决冲突的呢。问的好～，既然它们的哈希索引相同又会拿什么比较呢，
我们今天的主角出现了哈希值（在java里面它叫hashCode），在java中每一个对象，键(key)和值(value)都是对象所以他们都有哈希值
，但是对象的哈希值与HashMap中的哈希是不一样的，我们把对象哈希值叫原生哈希值，而把HashMap中的哈希值叫*哈希值*。
然而*哈希值*是通过原生哈希得来的`hashCode ＝ hashCode(key.hashCode())`。当哈希索引相同时，就可以来比较*哈希值*。
链桶是没有顺序的，先插入的排在前面，后插入的排在后面，所以检索时，通过键的*哈希值*和链桶的*哈希值比较，
并且在它们的*哈希值*相同时，还要进行键（key）的比较，桶（bin）是键值对key－value，
只有当`key ＝＝ bin.key || ( k != null && k.equals(bin.key))`成立时才算完全匹配。
在红黑树中，桶的排列是有顺序的按照*哈希值从小到大排列，这样排列是为了快速查找。但是比较规则与链桶是一致的。
这里问题又来了，即然树桶是有顺序的，那么当树桶的*哈希值*相同时，又怎么排序呢，当它们的*哈希值*相同时会判断键(key)
是否是`C implements Comparable<C>`这样的（可比较的），如果键(key)和链桶的键都是可比较的(comparable)
就接比较的顺序从小到大排序，如果不是那么这样的桶之间是无序的，注意:在树插入桶的时候如果桶之间*哈希值相同*,
但是桶是不可比较的（不是comparable),桶之间会按照`System.identityHashCode(key)`大小的顺序插入，
如果这也相同后面进入的桶插入之前桶的左结点上（后面）。


## 动态变化
&emsp;&emsp;
	我们在[基本原理](## 基本原理)中介绍了HashMap中的散列表是如何解决冲突的，现在我们将讨论的是这个散列表的动态变化。
在HashMap初始化时我们可以给定一个初始化大小`initialCapacity`，
HashMap会根据这个`initialCapacity`来计算出HashMap中散列表的大小`capacity`，
实际上`capacity`是一个不小于`initCapacity`且是2的n次幂的最小数。如果没有给定初始化大小，那么就会采用[默认初始化大小16]。
其实HashMap中的散列表就是一个数组，散列表的大小就是这个数组的大小，我们可以试想一下如果这个散列表很大，
那么它就可以放入很多的键值对，每个键值对就很少会有冲突（散列表越大，键值对放入到一个糟中的可能性越小）。
但是如果散列表很大，但是放入的键值对很少，就会浪费会多空间，所以我们就需要动态变化散列表的大小，
这样既可以节省空间又可以加快速度。这里引入一新的名词加载因子`loadFactor`，另外我们把HashMap中键值对的对数叫`size`，
还有极限值`threshold`，这个值是用来判断散列表是否应该扩大其容量。一般情况下`threshold = capacity * loadFactory`，
当初始化时，由于会将根据`initalCapacity`计算的容量`capacity`赋给`threshold`,因为在HashMap中没有一个专门用来保存散列表大小的变量。

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

	// 这个HashMap结构变化次数，结构变化指的是键值对数量的改变
	// 或者table重新调整大小致内部结构的改变
	// 这个字段用来判断在迭代这个map时，map是否已经发生变化。
	transient int modCount;

	// 重新调整哈希表后，HashMap中能够装的键值对的对数（capacity * load factor）
	// 初始化时给定的哈希表大小(值必须是二的n次幂)
	// 或者初始化进默认哈希表大小*DEFAULT_INITIAL_CAPACITY
	int threshold;

	// 加载因子，一旦赋值就不能再改变
	final float loadFactor;
	
## 公共方法
{% highlight ruby %}
// get方法通过hash方法获得键的hash值，然后将hash值，和key传给getNode方法。
public V get(Object key) { 
	Node<K,V) e;
	return (e = getNode(hash(key), key)) == null ? null : e.value;
}

// getNode是供get方法调用的，首先根据hash值找到key会映射到哪个哈希表中
// 算法是node = table[(length-1) & hash]
// 找到对应的哈希表的bin了，以下主要有两种情况，
// 1、bin可能是链表 2、也有可能是TreeNode(二叉树)。
// 不过首先应该将bin的第一个（first)拿出来比较，
// 虽然hash映射到哈希表中，但是这个哈希不一定相等，所以还要比较hash值。
// 映射的条件是：哈希值相等，并且它们是相等的（==相等,或者相互equals),
// 如果不相等证明它们不能映射,返回空。
final Node<K,V> getNode(int hash, Object key) {
	Node<K,V>[] tab; Node<K,V> first, e; int n; K k;
	if ((tab = table) != null && (n = tab.length) > 0 &&
		(first = tab[(n-1) & hash]) != null) { 	
		// hash算法： node = table[(length - 1) & hash]
		if (first.hash == hash && // always check first node
				((k = first.key) == key || (key != null && key.equals(k))))
				return first;
		if ((e = first.next) != null) {
		if (first instance of TreeNode) {
			// 通过调用树的查询方法找出对应的结点
			// bin是树状结构，搜索树的遍历复杂度为lg(n)
				return ((TreeNode<K,V>)first).getTreeNode(hash, key);
			}
			// 如果bin不是树状结构，那么它是链状结构，通过遍历链表查询关键字
			do {
				if (e.hash == hash &&
					 ((k = e.key) ==key || (key != null && key.equals(key))))
							return e;
				e = e.next;
			} while(e != null)
		}
	}
	return null;
}

// 公有方法put(key,value), 插入键值对, 返回key对应哈希表中的原始值，
// 如果不存在，返回空
public V put(K key, V value){ return putVal(hash(key), key, value);}

// putVal方法是供put方法调用的
// 选通过`(n - 1) & hash`来得到散列表的索引，然后根据索引找到散表的糟，如果糟为空，
// 就将新加入的键值对放入糟中，否则判断糟是否是树糟，如果是树糟的话，就在树中查找该键是否已经存在，
// 如果存在返回之前的值，如果不存在就将其插入到糟树中。
// 如果只是普通的糟的话，就通过链表遍历该链糟，直到找到相同的键，或者到最后一个，并把它插入到链糟中。
// 如果链糟太长，变需要将链糟变成树糟（当链糟的长度大于TREEIFY——THRESHOLD时）
// 注意在插到散列表中后，还判断散列表是否需要扩容。
    final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }



{% endhighlight %}

**以下是翻译**

&emsp;&emsp;
	一般情况下这种Map的内部哈希表是桶(bin)方式实现的(所谓桶就是在同一个哈希表位上多个结点之间是
以链表方式存储的)，但变得太大时,桶就会转变成树结点(同一个哈希位上多个结点之间是以二叉树方式存储
的。这个结构与java.util.TreeMap中结构一致。大多数方法会优先使用桶，但是当可以用树结点时，会将桶
转变成树结点。树结点可以被遍历，用起来和普通的桶一样，但是当桶过于密集时，树结点支持快速查找
(fast-lookup)。因为大多数情况下桶不会过于密集，所以在哈希表方法中检查树结点的存在会造成耗时。

&emsp;&emsp;
	树结点主要以哈希值排序，当他们的哈希值相同时(被称作ties),会去判断树结点的key是否是这样的类
class C implements Comparable<C>,如果是则需要调用他们的compareTo方法去排序（会用反射去验证是否
满足上述条件）。树结点的新增操作在最坏情况下的时间复杂度是O(lgn)当树结点的key的哈希值相等且key
不能通过compareTo方法比较时，当hashCode()方法被意外地或者是恶意编程使得多个key具有相同的哈希值,
只要key是可以比较的，那么性能会优雅的下降（性能不会怎么变坏）。(如果这两个情况都不存在，我们会
浪费掉两倍的时间跟空间)

&emsp;&emsp;
	因为树结点是普通桶的两倍大小，只有当桶中的桶过多时，我们才会把普通的桶转化为树结点，当桶中
的数量达到TREEIFY_THRESHOLD这个值时，才会转化。当由于删除操作或者resize操作使得中的树结点太少时
(see UNTREEIFY_THRESHOLD)，树结点会变成普通的桶. 当哈希值分布良好时，bin会很少使用。在理想情况
下，对于随机的哈希值，bins中的结点服从[泊松分布](http://en.wikipedia.org/wiki/Poisson_distribution)
,默认调整大小的参数是0.5，阈值是0.75，因为重新调整大小会导致方差的变化，但是忽略方差，列表k出现
的期望值是(exp(-0.5) * pow(0.5, k) / factorial(k))

	 0:		0.60653066
	 1:		0.30326533
	 2:		0.07581633
	 3:		0.01263606
	 4:		0.00157952
	 5:		0.00015795
	 6:		0.00001316
	 7:		0.00000094
	 8:		0.00000006
	 more:	less than 1 in ten million

&emsp;&emsp;
	树的根结点通常是树结点中的第一个结点，有时候（通常发生在Iterator.remove删除了第一个结点）,
但是可以能过父结点链接到根结点。（TreeNode.root()方法）所有内部可用的方法接受一个哈希值作为参数
（通常是用公用方法提供的），允许他们相互调用而不用重新计算哈希值，大多数内部方法也接受一个参数
*tab*,它通常就是HashMap里的*table*（哈希表），tab可能表示新哈希表也可能表示原哈希表，因为哈希表
重新调整大小，或者重新构造哈表都会导致哈希表变化。
