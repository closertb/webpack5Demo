"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultConfig = {
    minSize: 30000,
    chunks: 'all',
    name: false,
    disablePreload: true,
    cacheGroups: {
        // 去掉默认配置, 否则除了vendors，还会将node_modules其他复用的模块打一个包；
        default: false,
        vendors: {
            // cacheGroups重写继承配置，设为false不继承
            test: /[\\/]node_modules[\\/]_?(react|react-dom|react-router|react-router-dom|lodash|antd|moment|immer|immutable)[@,\\/]/,
            name: 'vendors',
            minChunks: 1,
            priority: -20,
        },
    },
};


function updateAssetsV5(compilation, RawSource) {
  return (item, source) => {
    compilation.updateAsset(
      item,
      new RawSource(source)
    );
  };
}

class ChunkOptimazitionPlugin {
    constructor(opts) {
        this.opts = Object.assign({
            // 默认配置;
            selfDefine: false,
            useDefault: true,
            absolute: false,
            fasterBuild: false,
            // 双端项目
            mixin: false,
        }, opts);
        const envs = {};
        this.timeStamp = Date.now();
        this.publishEnv = envs.PUBLISH_ENV || 'local';
        this.isNotLinePro = opts.fasterBuild ? (this.publishEnv === 'test' || this.publishEnv === 'ppe') : this.publishEnv === 'daily';
    }
    apply(compiler) {
        const pluginName = ChunkOptimazitionPlugin.name;

        const isV5 = true;
        // 修正sourcemap类型设置问题
        compiler.hooks.environment.tap(pluginName, () => {
            // 如果传入了jsonpFunction，就注入
            if (this.opts.jsonpFunction) {
                if (isV5) {
                    compiler.options.output.chunkLoadingGlobal = this.isNotLinePro ? `${this.opts.jsonpFunction}-${this.timeStamp}` : this.opts.jsonpFunction;
                }
                else {
                    compiler.options.output.jsonpFunction = this.opts.jsonpFunction;
                }
            }
            // eval 类型的输出是有问题的，或导致下面修改app.config.js失效
            if (compiler.options.devtool && compiler.options.devtool.includes('eval')) {
                compiler.options.devtool = 'inline-source-map';
            }
        });
        // 接受自定义chunk分包设置
        compiler.hooks.entryOption.tap(pluginName, () => {
            const { splitChunks } = compiler.options.optimization;
            this.entrys = Object.keys(compiler.options.entry);
            // 如果外围已经自定义了splitChunks，就不再干预
            if (this.opts.selfDefine) {
                return;
            }
            // 添加自定义splitChunks 配置;
            compiler.options.optimization.splitChunks = Object.assign(splitChunks, this.opts.useDefault ? defaultConfig : this.opts.config);
        });
        const { webpack } = compiler;
        // Compilation object gives us reference to some useful constants.
        const { Compilation } = webpack;
        const { RawSource } = webpack.sources;
        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tap({
                name: pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
            }, (assets) => {
                this.handler(compilation, assets, updateAssetsV5(compilation, RawSource));
                return assets;
            });
            return compilation;
        });
    }
    handler(compilation, assets, updateAssets) {
        const record = new Set();
        const chunkOnlyConfig = {
            assets: false,
            cached: false,
            children: false,
            chunks: true,
            chunkModules: false,
            chunkOrigins: false,
            errorDetails: false,
            hash: false,
            modules: false,
            reasons: false,
            source: false,
            timings: false,
            version: false,
        };
        
        console.time(ChunkOptimazitionPlugin.name);
        const configs = compilation.getStats().toJson(chunkOnlyConfig);

        // 获取项目的publicPath;
        const { publicPath } = configs;
        const allChunks = configs.chunks;
        const { disablePreload, mixin } = this.opts;
        const dependencyMap = new Map();
        // 遍历构建产物
        const timestamp = `?t=${this.timeStamp}`;
        // 非线上正式环境
        const queryStr = this.isNotLinePro ? timestamp : '';
        // console.log('start file', publicPath, allChunks);

        allChunks.forEach(({ id, entry = false, siblings, names = ['unknown'] }) => {
            // 寻找有依赖公共包的模块；
            if (entry) {
                const name = mixin ? (names[0] || '').replace('pages/', '') : names[0];
                dependencyMap.set(name, siblings);
            }
        });
        console.log('start file', dependencyMap, disablePreload);

        for (const iterator of dependencyMap) {
            const [page, siblings = []] = iterator;
            const item = `${page}.js`;
            console.log('kkkk name:', page, item);
            
            // 已经处理过了就不再处理
            if (record.has(page)) {
                return;
            }
            // 找.js 文件
            let content = assets[item].source();
            const dependcysStr = siblings.length ?
                // { 'app-config': [], export: [ 2 ] }
                siblings
                    // 找出依赖[id]对应的文件
                    .reduce((pre, cur) => pre.concat(allChunks.find(chunk => chunk.id === cur).files || []), [])
                    // 过滤文件中的css依赖
                    .filter(file => /\.js$/.test(file))
                    // 将依赖文件变成一个相对路径, 非线上环境打上时间戳，保证多次部署无缓存干扰
                    .map(file => `'${this.opts.absolute ? publicPath : './'}${file}${queryStr}'`).join(',') : '';
            // console.log('item:', page, dependencyMap, dependcysStr);
            if (dependcysStr.length) {
                const matchs = content.match(/^System\.register\(\[(.{0,100})?\],[\s|(]?function/);
                const currentDependStr = matchs && matchs[1] ? matchs[1] : '';
                content = content.replace(`System.register([${currentDependStr}`, `System.register([${currentDependStr}${currentDependStr ? ',' : ''}${dependcysStr}`);
                // 更新构建产物对象
                updateAssets(item, content);
                record.add(page);
            }
        }
        console.timeEnd(ChunkOptimazitionPlugin.name);
    }
}
exports.default = ChunkOptimazitionPlugin;
