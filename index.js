const ArgumentType = require("../../extension-support/argument-type");
const BlockType = require("../../extension-support/block-type");
const formatMessage = require("format-message");
//const RateLimiter = require("../../util/rateLimiter.js");
//const io = require("socket.io-client"); // yarn add socket.io-client socket.io-client@2.2.0
const AdapterBaseClient = require("../scratch3_eim/codelab_adapter_base.js");

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
const blockIconURI = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNC4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0i5Zu+5bGCXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDAgNDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQwIDQwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZmlsbDojRkZGRkZGO30NCgkuc3Qxe2ZpbGw6IzIwNDg5NTt9DQoJLnN0MntmaWxsOiNGQ0Q1NjU7fQ0KPC9zdHlsZT4NCjx0aXRsZT7mianlsZXmj5Lku7bphY3lm77orr7orqE8L3RpdGxlPg0KPGcgaWQ9Il8zLl9QeXRob24iPg0KCTxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0xNS42LDYuODJjLTAuNzIsMC0xLjM1LDAuNjMtMS4zNSwxLjM1YzAsMC42MywwLjQ3LDEuMTksMS4xOSwxLjI3aDAuMDhjMC43MiwwLDEuMzUtMC42MywxLjM1LTEuMzUNCgkJYzAtMC42My0wLjQ3LTEuMTktMS4xMS0xLjI3QzE1LjY3LDYuODIsMTUuNjcsNi44MiwxNS42LDYuODJ6Ii8+DQoJPHBhdGggY2xhc3M9InN0MSIgZD0iTTE5LjI0LDE5LjI4aDMuNzNjMi4wNiwwLDMuNzMtMS42NiwzLjczLTMuNzNWOC4wMWMtMC42My01LTE0LjIxLTQuMi0xNC4yMS0wLjQ3djMuNjZoNy4xNHYxLjU5SDkuMzINCgkJYy02LjExLDAuMjQtNS43MiwxNC4yOSwwLDE0LjI5aDIuMzFDMTEuMjIsMTkuMTMsMTIuOTcsMTkuMjgsMTkuMjQsMTkuMjh6IE0xNS41MSw5LjM2Yy0wLjYzLDAtMS4xOS0wLjQ3LTEuMjctMS4xOVY4LjA5DQoJCWMwLTAuNzIsMC42My0xLjM1LDEuMzUtMS4zNWMwLjYzLDAsMS4xOSwwLjQ3LDEuMjcsMS4xMWMwLDAuMDgsMCwwLjA4LDAsMC4xNkMxNi45NCw4LjgsMTYuMzEsOS4zNiwxNS41MSw5LjM2TDE1LjUxLDkuMzZ6Ii8+DQoJPHBhdGggY2xhc3M9InN0MiIgZD0iTTIwLjY3LDIwLjcyaC0zLjczYy0yLjA2LDAtMy43MywxLjY2LTMuNzMsMy43M3Y3LjU0YzAuNjMsNSwxNC4yMSw0LjIsMTQuMjEsMC40N3YtMy42NmgtNy4xNHYtMS41OWgxMC40DQoJCWM2LjExLTAuMjQsNS43Mi0xNC4yOSwwLTE0LjI5aC0yLjMxQzI4LjY5LDIwLjg3LDI2Ljk0LDIwLjcyLDIwLjY3LDIwLjcyeiBNMjQuNCwzMC42NGMwLjYzLDAsMS4xOSwwLjQ3LDEuMjcsMS4xOXYwLjA4DQoJCWMwLDAuNzItMC42MywxLjM1LTEuMzUsMS4zNWMtMC42MywwLTEuMTktMC40Ny0xLjI3LTEuMTFjMC0wLjA4LDAtMC4wOCwwLTAuMTZDMjIuOTgsMzEuMiwyMy42MSwzMC42NCwyNC40LDMwLjY0eiIvPg0KPC9nPg0KPC9zdmc+DQo=';
const menuIconURI = blockIconURI;

const NODE_ID = "eim/extension_python";
const HELP_URL =
    "https://adapter.codelab.club/extension_guide/extension_python_kernel/";


class Client {
    onAdapterPluginMessage(msg) {
        this.node_id = msg.message.payload.node_id;
        if (
            this.node_id === this.NODE_ID ||
            this.node_id === "ExtensionManager"
        ) {
            // todo 响应插件关闭消息， 从terminate关闭，可以自关闭
            this.adapter_node_content_hat = msg.message.payload.content;
            this.adapter_node_content_reporter = msg.message.payload.content;
            if(this.adapter_node_content_reporter && this.adapter_node_content_reporter.addresses){
                this.addresses = this.adapter_node_content_reporter.addresses;
            }
        }
    }

    notify_callback(msg) {
        // 使用通知机制直到自己退出
        if (msg.message === `停止 ${this.NODE_ID}`){
            console.warn(`停止 ${this.NODE_ID}`);
        }
    }


    constructor(node_id, help_url, runtime) {
        this.NODE_ID = node_id;
        this.HELP_URL = help_url;

        this.adapter_base_client = new AdapterBaseClient(
            null, // onConnect,
            null, // onDisconnect,
            null, // onMessage,
            this.onAdapterPluginMessage.bind(this), // onAdapterPluginMessage,
            null, // update_nodes_status,
            null, // node_statu_change_callback,
            this.notify_callback.bind(this), // notify_callback,
            null, // error_message_callback,
            null, // update_adapter_status
            100, // SendRateMax = 60 default
            runtime
        );
    }

    isTargetTopicMessage(targetContent) {
        if (
            // targetContent === "_any"
            (targetContent === this.adapter_node_content_hat || targetContent === "_any") &&
            this.NODE_ID === this.node_id
        ) {
            setTimeout(() => {
                this.adapter_node_content_hat = null; // 每次清空
                this.node_id = null;
            }, 1); //ms
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
        this.adapter_client = new Client(NODE_ID, HELP_URL, runtime);
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
            name: "Python",
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
        return this.adapter_client.isTargetTopicMessage(content);
    }

    getComingMessage() {
        return this.adapter_client.adapter_node_content_reporter;
    }

    // broadcast message
    // 使用广播的概念, 与scratch保持一致
    broadcastMessage(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        this.adapter_client.adapter_base_client.emit_without_messageid(
            this.adapter_client.NODE_ID,
            content
        );
        return;
    }

    broadcastMessageAndWait(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this.adapter_client.adapter_base_client.emit_with_messageid(
            this.adapter_client.NODE_ID,
            content
        );
    }

    broadcastMessageAndWait_reporter(args) {
        const content = args.content;
        //this.socket.emit("actuator", { topic: TOPIC, payload: message });
        return this.adapter_client.adapter_base_client.emit_with_messageid(
            this.adapter_client.NODE_ID,
            content
        );
    }

    control_extension(args) {
        const content = args.turn;
        const ext_name = args.ext_name;
        return this.adapter_client.adapter_base_client.emit_with_messageid_for_control(
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
