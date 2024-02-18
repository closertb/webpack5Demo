2023, 我跨过的技术沟壑

## 角色的转变

在做商品前端之前，我是本地生活前端基础设施WAP平台的全栈开发者。我对接的客户是本地生活的前端，区别于业务前端的是，自己即是产品、也是开发、测试、运维。

商品前端作为业务开发，其工作更细，更强调团队，除了要和产品、服务端、测试密切配合；还需要关注上下游链路、依赖更多，制约更多。

而除了上述差别，还有就是更关注用户体验、关注客诉、关注线上问题。以下便是我2023年遇到的奇葩、棘手，让人个人成长但不多的业务问题集锦top4, 分享与各位共勉：

## 一个表情符造成的崩溃

## UC内核打造的出其不意

## 偶现的bug，奔溃的调试

## 分包也能分出线上问题

一说起webpack的构建拆包，你可能马上就知道要用SplitChunk组件加个配置，这玩意多简单，最多分出个样式问题（由于加载时序造成的同权重样式优先级变化）。但我今年遇到了神奇的，还不止一次，我拆包后，发现大多数页面能运行，但部分页面的某个功能一点，页面就白屏了，一检查，还是那熟悉的味道：`Cannot read properties of undefined`。

在做移动端的拆包优化时，遇到过这问题，也是临近上线才发现，当时时间紧没研究问题，后面就紧急把配置回滚。但今年老板紧追页面加载体验问题，这PC端一个页面4.2M的包，不做拆包就只有贱指`325`了。是时候动一下手指，加一波配置，原以为经过九九八十一难后，这次一定会成功，但在内灰时，赶巧被测试发现，点某个小功能又白屏了，啥也不说，马上配置回滚，紧急再重新内灰。
![20240215231254](https://doddle.oss-cn-beijing.aliyuncs.com/oldNotes/20240215231254.png)
临近财年底，手上业务没那么重，就认真研究了下，这不，有点效果！！！[放假前给webpack官方提了一个Issue](https://github.com/webpack/webpack/discussions/18054), 让他过不好年(大意了，别人不是中国人), 但过了一天，那熟悉的味道又来了，大概意思：`同学你好，你的问题我收到了，你能提供一个最小单元的复现示例吗`

另外要强调一点，这种bug只会在生产模式才会出现，开发模式是没法复现的。

满怀信心去新建一个项目，以为能复现，但事实证明，这可能不是官方的bug。但更残酷的事实是：`过不好年的，可能是我`。

但这个示例还是有用的，经过将示例项目和业务项目构建结果对比，发现业务项目会多出这样一段结果：
```js
/******/ 	/* webpack/runtime/runtimeId */
/******/ 	(() => {
/******/ 		__webpack_require__.j = 335;
/******/ 	})();
```

经过大年初一初二初三不断抽时间看源码，慢慢发现了蛛丝马迹：
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
- 不同的入口对组件的引用方式（直接引用和间接引用），导致index.js中的导出有运行时条件

最直接的解决策略就是改库的sideEffects的配置，因为这个库的index.js有一段关于样式的副作用代码，所以调整还包括了库整体架构的调整。终于，终于，在大年初四，我开始心无旁骛的过年了。




