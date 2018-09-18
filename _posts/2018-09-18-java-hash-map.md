---
layout: post
title: java HashMap 笔记
author: site.data.brume.author
date: 2018-09-18 23:09:30
---

# Hash Map 源代码详解

**以下是翻译**

这种Map一般情况下会是以桶(binned)方式装载的哈希表，当桶（bins)变得太大时,桶就会转变成树
结点(TreeNode)。这个结构与java.util.TreeMap中结构一致。大多数方法会优先使用bins,
但是当可以用树结点时，会将bins转变成TreeNode。TreeNode可以被遍历，用起来和普通的bins一样，
但是TreeNode支持快速查找(fast-lookup)当bins过于密集时。因为大多数情况下，bins不会过于密集，
所以在哈希表方法中有检查bins的存在会造成延时。

TreeNode bins 主要以哈希值排序，当他们的哈希值相同时(被称作ties),会去判断bin的key是否是这样的类
class C implements Comparable<C>,如果是则需要调用他们的compareTo方法去排序（会用反射去验证
是否满足上述条件）。TreeNode bin的新增操作在最坏情况下的时间复杂度是O(lgn)当bin的key的哈希值相等
且key不能通过compareTo方法比较时，当hashCode()方法被意外地或者是恶意编程使得多个key具有相同的哈希值，
只要key是可以比较的，那么性能会优雅的下降（性能不会怎么变坏）。(如果这两个情况都不存在，我们会浪
费掉两倍的时间跟空间)

因为TreeNode是普通bin的两倍大小，只有当bins中的bin过多时，我们才会把普通的bin转化为TreeNode(bin)
当bins中的数量达到TREEIFY_THRESHOLDv(see TREEIFY_THRESHOLD)这个值时，才会转化。当由于删除操作
或者resize操作使得中的bins太少时(see UNTREEIFY_THRESHOLD)，TreeNode会变成普通bin. 当哈希值分布
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

树的根结点通常是bins的第一个结点，有时候（通常发生在Iterator.remove删除了第一个结点），但是可以能过父结点
链接到根结点。（TreeNode.root()方法）

所有内部可用的方法接受一个哈希值作为参数（通常是用公用方法提供的），允许他们相互调用而不用重新计算哈希值，
大多数内部方法也接受一个参数*tab*,它通常就是HashMap里的*table*（哈希表），但是也有可能是旧的或者新的当
当重新构建table(resize),或者转化table时。


## Hash Map 常量

    /**
     * The default initial capacity - MUST be a power of two.
     */
    // 默认初始化大小16, 这个值必须是2的幂次方
    // 初始化大小可以被指定
    // 指的是Hash Table的大小
    static final int DEFAULT_INITIAL_CAPACITY = 1 << 4;
    
    /**
     * The maximum capacity, used if a higher value is implicitly specified
     * by either of the constructors with arguments.
     * MUST be a power of two <= 1<<30.
     */
    // 最大容量，给定的初始化大小必须比最大容量小
    // 如果给定的大小比最大容量大，初始化大小就取 1 << 30
    static final int MAXIMUM_CAPACITY = 1 << 30;
    
    /**
     * The load factor used when none specified in constructor.
     */
     // 默认的加载因子，当构造方法中没有指定时，加载因子大小设置为0.75
     // 当HashMap大小 > LOAD_FACTOR * CAPACITY
     static final float DEFAULT_LOAD_FACTOR = 0.75f;
     
    /**
      * The bin count threshold for using a tree rather than list for a
      * bin.  Bins are converted to trees when adding an element to a
      * bin with at least this many nodes. The value must be greater
      * than 2 and should be at least 8 to mesh with assumptions in
      * tree removal about conversion back to plain bins upon
      * shrinkage.
      */
    static final int TREEIFY_THRESHOLD = 8;
     
    /**
     * The bin count threshold for untreeifying a (split) bin during a
     * resize operation. Should be less than TREEIFY_THRESHOLD, and at
     * most 6 to mesh with shrinkage detection under removal.
     */
    static final int UNTREEIFY_THRESHOLD = 6;
    
    /**
     * The smallest table capacity for which bins may be treeified.
     * (Otherwise the table is resized if too many nodes in a bin.)
     * Should be at least 4 * TREEIFY_THRESHOLD to avoid conflicts
     * between resizing and treeification thresholds.
     */
    static final int MIN_TREEIFY_CAPACITY = 64;

