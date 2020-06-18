const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
const RateLimiter = require("../../util/rateLimiter.js");
const io = require("socket.io-client"); // yarn add socket.io-client socket.io-client@2.2.0

// 翻译
const FormHelp = {
    en: "help",
    "zh-cn": "帮助",
};

const Form_control_extension = {
    en: "[turn] [ext_name]",
    "zh-cn": "[turn] [ext_name]",
}

const Form_whenMessageReceive = {
    en: "when I receive [content]",
    "zh-cn": "当接收到 [content]",
}

const Form_getComingMessage = {
    en: "received message",
    "zh-cn": "收到的消息",
}

const Form_sendMessageAndWait = {
    en: "broadcast [content] and wait",
    "zh-cn": "广播[content]并等待",
}

const Form_sendMessage = {
    en: "broadcast [content]",
    "zh-cn": "广播 [content]",
}

const Form_broadcastMessageAndWait_REPORTER = {
    en: "broadcast [content] and wait",
    "zh-cn": "广播[content]并等待",
}

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
// import blockIconURI from './icon_logo.png';
const blockIconURI = require('./icon_logo.png');
const menuIconURI = blockIconURI;

const NODE_ID = "eim/extension_python";
const HELP_URL =
    "https://adapter.codelab.club/extension_guide/extension_python_kernel/";

class AdapterClient {
    constructor(node_id, help_url) {
        // console.log(`${NODE_ID} init AdapterClient`)
        const ADAPTER_TOPIC = "adapter/nodes/data";
        const EXTS_OPERATE_TOPIC = "core/exts/operate";
        const NODES_OPERATE_TOPIC = "core/nodes/operate";
        this.SCRATCH_TOPIC = "scratch/extensions/command";
        this.NODE_ID = node_id;
        this.HELP_URL = help_url;
        this.plugin_topic_map = {
            node: NODES_OPERATE_TOPIC,
            extension: EXTS_OPERATE_TOPIC,
        };

        this._requestID = 0;
        this._promiseResolves = {};
        const SendRateMax = 10;
        this._rateLimiter = new RateLimiter(SendRateMax);

        const url = new URL(window.location.href);
        var adapterHost = url.searchParams.get("adapter_host"); // 支持树莓派(分布式使用)
        if (!adapterHost) {
            var adapterHost = window.__static
                ? "127.0.0.1"
                : "codelab-adapter.codelab.club";
        }
        // console.log(`${this.NODE_ID} ready to connect adapter...`)
        this.socket = io(
            `${window.__static ? "https:" : ""}//${adapterHost}:12358` +
                "/test",
            {
                transports: ["websocket"],
            }
        );

        this.socket.on("sensor", (msg) => {
            this.topic = msg.message.topic;
            this.node_id = msg.message.payload.node_id;
            const message_id = msg.message.payload.message_id;
            if (
                this.topic === ADAPTER_TOPIC &&
                (this.node_id === this.NODE_ID ||
                    this.node_id === "ExtensionManager")
            ) {
                // 只接收当前插件消息
                // ExtensionManager 恢复关于插件的控制信息
                window.message = msg;
                this.adapter_node_content_hat = msg.message.payload.content; 
                this.adapter_node_content_reporter = msg.message.payload.content;
                console.log(
                    `${this.NODE_ID} message->`,
                    msg.message.payload.content
                );
                // 处理对应id的resolve
                if (typeof message_id !== "undefined") {
                    this._promiseResolves[message_id] &&
                        this._promiseResolves[message_id](
                            msg.message.payload.content
                        );
                }
            }
        });
    }

    get_reply_message(messageID) {
        const timeout = 5000; // ms 交给用户选择
        return new Promise((resolve, reject) => {
            this._promiseResolves[messageID] = resolve; // 抛到外部
            setTimeout(() => {
                reject(`timeout(${timeout}ms)`);
            }, timeout);
        });
    }

    emit_with_messageid(node_id, content) {
        // payload is dict
        //messageID: messageID
        /*
    if (typeof payload !== 'object'){
      console.error('payload should be object');
    }*/
        const messageID = this._requestID++;
        const payload = {};
        payload.node_id = node_id;
        payload.content = content;
        payload.message_id = messageID;
        this.socket.emit("actuator", {
            payload: payload,
            topic: this.SCRATCH_TOPIC,
        });
        return this.get_reply_message(messageID);
    }

    emit_without_messageid(node_id, content) {
        const payload = {};
        payload.node_id = node_id;
        payload.content = content;
        this.socket.emit("actuator", {
            payload: payload,
            topic: this.SCRATCH_TOPIC,
        });
    }

    emit_with_messageid_for_control(node_id, content, node_name, pluginType) {
        if (!this._rateLimiter.okayToSend()) return Promise.resolve();

        const messageID = this._requestID++;
        const payload = {};
        payload.node_id = node_id;
        payload.content = content;
        payload.message_id = messageID;
        payload.node_name = node_name;
        this.socket.emit("actuator", {
            payload: payload,
            topic: this.plugin_topic_map[pluginType],
        });
        return this.get_reply_message(messageID);
    }

    whenMessageReceive(content) {
        //rename bool func
        if (
            this.adapter_node_content_hat&&
            content === this.adapter_node_content_hat
        ) {
            setTimeout(() => {
                this.adapter_node_content_hat = null; // 每次清空
            }, 1); //ms // 每次清空
            return true;
        }
    }

}

// EIM: Everything Is Message
class PythonBlocks {
    constructor(runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.adapter_client = new AdapterClient(NODE_ID, HELP_URL);
    }

    /**
     * The key to load & store a target's test-related state.
     * @type {string}
     */
    static get STATE_KEY() {
        return "Scratch.python";
    }

    _setLocale() {
        let now_locale = "";
        switch (formatMessage.setup().locale) {
            case "en":
                now_locale = "en";
                break;
            case "zh-cn":
                now_locale = "zh-cn";
                break;
            default:
                now_locale = "zh-cn";
                break;
        }
        return now_locale;
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo() {
        let the_locale = this._setLocale();
        return {
            id: "python",
            name: "Python Kernel",
            menuIconURI: menuIconURI,
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: "open_help_url",
                    blockType: BlockType.COMMAND,
                    text: FormHelp[the_locale],
                    arguments: {},
                },
                {
                    opcode: "control_extension",
                    blockType: BlockType.COMMAND,
                    text: Form_control_extension[the_locale],
                    arguments: {
                        turn: {
                            type: ArgumentType.STRING,
                            defaultValue: "start",
                            menu: "turn",
                        },
                        ext_name: {
                            type: ArgumentType.STRING,
                            defaultValue: "extension_python",
                            menu: "extensions_name",
                        },
                    },
                },
                {
                    opcode: "whenMessageReceive",
                    blockType: BlockType.HAT,
                    text: Form_whenMessageReceive[the_locale],
                    arguments: {
                        content: {
                            type: ArgumentType.STRING,
                            defaultValue: "3",
                        },
                    },
                },
                /*
                {
                    opcode: "getComingMessage",
                    blockType: BlockType.REPORTER, // BOOLEAN, COMMAND
                    text: Form_getComingMessage[the_locale],
                    arguments: {},
                },
                */
                {
                    opcode: "broadcastMessageAndWait",
                    blockType: BlockType.COMMAND,
                    text: Form_sendMessageAndWait[the_locale],
                    arguments: {
                        content: {
                            type: ArgumentType.STRING,
                            defaultValue: "1+2",
                        },
                    },
                },
                {
                    opcode: "broadcastMessage",
                    blockType: BlockType.COMMAND,
                    text: Form_sendMessage[the_locale],
                    arguments: {
                        content: {
                            type: ArgumentType.STRING,
                            defaultValue: "1+2",
                        },
                    },
                },
                {
                    opcode: "broadcastMessageAndWait_reporter",
                    blockType: BlockType.REPORTER,
                    text: Form_broadcastMessageAndWait_REPORTER[the_locale],
                    arguments: {
                        content: {
                            type: ArgumentType.STRING,
                            defaultValue: "1+2",
                        },
                    },
                },
            ],
            menus: {
                // todo 动态
                extensions_name: {
                    acceptReporters: true,
                    items: ["extension_python"],
                },
                turn: {
                    acceptReporters: true,
                    items: ["start", "stop"],
                },
            },
        };
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */

    // when receive
    // 清空的方案不好（意味着获取消息和when不能混用），如果使用last message，也有问题，一样的消息将不触发
    whenMessageReceive(args) {
        const content = args.content;
        return this.adapter_client.whenMessageReceive(content);
    }

    getComingMessage() {
        return this.adapter_client.adapter_node_content_reporter;
    }

    // broadcast message
    // 使用广播的概念, 与scratch保持一致
    broadcastMessage(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        this.adapter_client.emit_without_messageid(
            this.adapter_client.NODE_ID,
            content
        );
        return;
    }

    broadcastMessageAndWait(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this.adapter_client.emit_with_messageid(
            this.adapter_client.NODE_ID,
            content
        );
    }

    broadcastMessageAndWait_reporter(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this.adapter_client.emit_with_messageid(
            this.adapter_client.NODE_ID,
            content
        );
    }

    control_extension(args) {
        const content = args.turn;
        const ext_name = args.ext_name;
        return this.adapter_client.emit_with_messageid_for_control(
            this.adapter_client.NODE_ID,
            content,
            ext_name,
            "extension"
        );
    }

    open_help_url(args) {
        window.open(HELP_URL);
    }
}

/*
注意安全问题: 赋予用户强大的能力，但提醒他们担心锤子砸伤脚
*/

module.exports = PythonBlocks;
