2023, 我跨过的技术沟壑

## 角色的转变

在做商品前端之前，我是本地生活前端基础设施WAP平台的全栈开发者。我对接的客户是本地生活的前端，区别于业务前端的是，自己即是产品、也是开发、测试、运维。

商品前端作为业务开发，其工作更细，更强调团队，除了要和产品、服务端、测试密切配合；还需要关注上下游链路、依赖更多，制约更多。

而除了上述差别，还有就是更关注用户体验、关注客诉、关注线上问题。以下便是我2023年遇到的奇葩、棘手，让人个人成长但不多的业务问题集锦top4, 分享与各位共勉：

## 一个表情符造成的崩溃
某天要下班提包走的瞬间，突然产品拉群，运维反馈说XX商户批量操作菜品时页面白屏，并发了个视频。
![20240218230336](http://www.gaoxiaotu.cn/uploads/allimg/130915/1-130915231100.gif)

发错了，是下面这个


我们迅速根据商家信息去查了接口调用日志，发现请求正常，响应正常未超时，前端系统日志也正常，未上报任何报错信息。

几个人对视频又观察分析，发现商户小程序选菜页面正常，只是H5应用打开时才会白屏。然后又和运维交流了一下，说商户安卓手机能正常操作，只有苹果手机有问题（型号：IP15 PRO）。我们测试迅速在我们的测试商户复现，未成功复现。于是又联系运维，要了商户的临时登录帮助复现，也未复现（复现的机型时IP 13）。这就更蒙了，难道只有苹果高端机才有问题？

然后找到一位土豪同事，用他刚上手的水果试了一下，果然复现了，难道这真的是富贵病？？？
![20240218224959](https://doddle.oss-cn-beijing.aliyuncs.com/oldNotes/20240218224959.png)


但机智的我突然开窍，会不会是这个分类表情符造成的？我们迅速在测试账号复现了该分类，并成功验证这个猜想，确实是分类表情符被截断造成。当晚我们给出的建议是：改一下表情符出现的位置，或者减少数量。

第二天，另一个测试在一台IP 13也复现了，但APP版本一样，唯一不一样的，是系统的版本，他的更新。然后我们又升级了一台，果然是系统升级造成。至于为什么小程序没问题，因为小程序用的是UC内核容器，而H5用的是原生webview容器，即safari内核。

这难道了我，以前只知道去github给仓库作者提issue，这给苹果系统提issue，还是`大姑娘上轿`-头一回。

![20240218230040](https://doddle.oss-cn-beijing.aliyuncs.com/oldNotes/20240218230040.png)


## UC内核打造的出其不意  

## 偶现的bug，奔溃的调试

2023财年，最硬核输出可能就是wa-form了，这是KPI下硬挤出来的产物（两个憨憨熬夜一周），但不是废物，因为它确实解决了我们B端场景的联动校验问题，没有Formily那么多概念，但却有formily 70%的能力（大概）。

这个库在第一版时，直接在我们扩品类的业务项目上落地，出现了很多bug。但有一个bug，至今也没找到原因，大概的现象就是：
当我们在这个表单上，持续的触发联动校验，会突然的出现联动校验假死（和操作时间无关，没法稳定复现）；但更神奇的是，只会在一个测试机（水果13）出现，安卓机，其他人的苹果都不能复现，开发模式也不能。

但更神奇的事情是，出现这个bug连上safari开始debug时，联动校验又恢复了。所以这神秘的面纱，我们至今没有揭开。

当时我们也是经过评估，认为这个bug线上出现概率不大，确认可以不解决直接上线。



## 分包也能分出线上问题

一说起webpack的构建拆包，你可能马上就想到要用SplitChunk插件加个配置，这玩意多简单，最多分出个样式问题（由于加载时序造成的同权重样式优先级变化）。但我今年遇到了神奇的，还不止一次，我拆包后，发现大多数页面能运行，但部分页面的某个功能一点，页面就白屏了，一检查，还是那熟悉的味道：`Cannot read properties of undefined`。

更神奇的是，这种bug只会在生产模式出现，开发模式是不能复现的。

在做移动端的拆包优化时，遇到过这问题，也是临近上线才发现，当时时间紧没研究问题，后面就紧急把配置回滚。但今年老板紧追页面加载体验问题，这PC端一个页面4.2M的包，不做拆包就只有贱指`325`了。是时候动一下手指，加一波配置，原以为经过九九八十一难后，这次一定会成功，但在内灰时，赶巧被测试发现，点某个小功能又白屏了，啥也不说，马上配置回滚，紧急再重新内灰。

临近财年底，手上业务没那么重，就认真研究了下，这不，有点效果！！！[放假前给webpack官方提了一个Issue](https://github.com/webpack/webpack/discussions/18054), 让他过不好年(大意了，别人不是中国人), 但过了一天，那熟悉的味道又来了，大概意思：`同学你好，你的问题我收到了，你能提供一个最小单元的复现示例吗`

![20240215231254](https://doddle.oss-cn-beijing.aliyuncs.com/oldNotes/20240215231254.png)

满怀信心去新建一个项目，以为能复现，但事实证明，这可能不是官方的bug。但更残酷的事实是：`过不好年的，可能是我`。

但这个示例还是有用的，经过将示例项目和业务项目构建结果对比，发现业务项目会多出这样一段结果：
```js
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 335;
/******/ 	})();
```

经过大年初一初二初三不断抽时间看源码，发现了蛛丝马迹：
1. 加`webpack/runtime/runtimeId `的webpack钩子定义在
```js
// webpack/lib/RuntimePlugin.js
compilation.hooks.runtimeRequirementInTree
  .for(RuntimeGlobals.runtimeId)
  .tap("RuntimePlugin", chunk => {
    compilation.addRuntimeModule(chunk, new RuntimeIdRuntimeModule());
    return true;
  });

// RuntimeIdRuntimeModule 定义， webpack/lib/runtime/RuntimeIdRuntimeModule.js
class RuntimeIdRuntimeModule extends RuntimeModule {
	constructor() {
		super("runtimeId");
	}

	/**
	 * @returns {string} runtime code
	 */
	generate() {
		const { chunkGraph, chunk } = this;
		const runtime = chunk.runtime;
		if (typeof runtime !== "string")
			throw new Error("RuntimeIdRuntimeModule must be in a single runtime");
		const id = chunkGraph.getRuntimeId(runtime);
		return `${RuntimeGlobals.runtimeId} = ${JSON.stringify(id)};`;
	}
}
```

2. 所以要触发钩子调用，就得RuntimeGlobals.runtimeId变化，触发条件
```js
	runtimeConditionExpression({
		chunkGraph,
		runtimeCondition,
		runtime,
		runtimeRequirements
	}) {
		if (runtimeCondition === undefined) return "true";
		if (typeof runtimeCondition === "boolean") return `${runtimeCondition}`;
		
		/** @type {Set<string>} */
		const positiveRuntimeIds = new Set();
		forEachRuntime(runtimeCondition, runtime =>
			positiveRuntimeIds.add(`${chunkGraph.getRuntimeId(runtime)}`)
		);
		/** @type {Set<string>} */
		const negativeRuntimeIds = new Set();
		forEachRuntime(subtractRuntime(runtime, runtimeCondition), runtime =>
			negativeRuntimeIds.add(`${chunkGraph.getRuntimeId(runtime)}`)
		);
    // 这里有新增RuntimeGlobals.runtimeId 
		runtimeRequirements.add(RuntimeGlobals.runtimeId);
		return compileBooleanMatcher.fromLists(
			Array.from(positiveRuntimeIds),
			Array.from(negativeRuntimeIds)
		)(RuntimeGlobals.runtimeId);
	}
```
所以，只有在 runtimeCondition 存在且不为boolean时，才会触发RuntimeGlobals.runtimeId添加。

boolean为true时，代表所有chunk都需要；

boolean为false时，代表所有chunk都不需要，可以shaking掉；

3. 至于什么情况会导致runtimeCondition 存在且不为boolean，这个逻辑非常冗长，简单说下我这边的原因：
- 因为我们业务的双端组件库，在package.json 配置时，错误的配置了sideEffects（至于为什么会这么配，应该是有意为之，index.js中确实有一段副作用代码，但可能没想到有这么大坑）
```json
{
  "sideEffects": [
    "es/**/style/*",
    "es/**/*.less",
    "es/theme/*",
    "es/index.js",
    "lib/**/style/*",
    "lib/**/*.less",
    "lib/theme/*",
    "lib/index.js"
  ],
}
```
- 然后在正式构建时，webpack默认开启了构建优化，所以个别文件构建由extermodule转成了concentratedModule（故只有正式包才能复现）
- 不同的入口对组件的引用方式（直接引用和间接引用），导致index.js中的导入有运行时条件

最直接的解决策略就是改库的sideEffects配置，因为这个库的index.js有一段关于样式的副作用代码，所以调整还包括了库整体架构的调整。终于，终于，在大年初五，我开始心无旁骛的过年了。




