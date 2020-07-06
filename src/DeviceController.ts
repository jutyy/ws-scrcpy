import Decoder from './decoder/Decoder';
import { DeviceConnection, DeviceMessageListener } from './DeviceConnection';
import VideoSettings from './VideoSettings';
import ErrorHandler from './ErrorHandler';
import KeyCodeControlEvent from './controlEvent/KeyCodeControlEvent';
import KeyEvent from './android/KeyEvent';
import CommandControlEvent from './controlEvent/CommandControlEvent';
import ControlEvent from './controlEvent/ControlEvent';
import TextControlEvent from './controlEvent/TextControlEvent';
import DeviceMessage from './DeviceMessage';

export interface DeviceControllerParams {
    url: string;
    name: string;
    decoder: Decoder;
    videoSettings: VideoSettings;
}

export class DeviceController implements DeviceMessageListener {
    public readonly decoder: Decoder;
    public readonly controls: HTMLDivElement;
    public readonly deviceView: HTMLDivElement;
    public readonly input: HTMLInputElement;

    constructor(params: DeviceControllerParams) {
        const decoder = this.decoder = params.decoder;
        const deviceName = params.name;
        const decoderName = this.decoder.getName();
        const controlsWrapper = this.controls = document.createElement('div');
        const deviceView = this.deviceView = document.createElement('div');
        deviceView.className = 'device-view';
        const connection = DeviceConnection.getInstance(params.url);
        const stream = params.videoSettings;
        connection.addDecoder(this.decoder);
        connection.setDeviceMessageListener(this);
        const wrapper = document.createElement('div');
        wrapper.className = 'decoder-controls-wrapper menu';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const controlsId = `controls_${deviceName}_${decoderName}`;
        checkbox.id = controlsId;
        const label = document.createElement('label');
        label.htmlFor = controlsId;
        // label.innerText = `${deviceName} (${decoderName})`;
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        const box = document.createElement('div');
        box.className = 'box';
        wrapper.appendChild(box);
        const textWrap = document.createElement('div');
        const input = this.input = document.createElement('input');
        const sendButton = document.createElement('button');
        sendButton.innerText = 'Send as keys';
        textWrap.appendChild(input);
        textWrap.appendChild(sendButton);

        box.appendChild(textWrap);
        sendButton.onclick = () => {
            if (input.value) {
                connection.sendEvent(new TextControlEvent(input.value));
            }
        };
        const deviceButtons = document.createElement('div');
        deviceButtons.className = 'control-buttons-list';
        const cmdWrap = document.createElement('div');
        const codes = CommandControlEvent.CommandCodes;
        for (const command in codes) {
            if (codes.hasOwnProperty(command)) {
                const action: number = codes[command];
                const btn = document.createElement('button');
                let bitrateInput: HTMLInputElement;
                let frameRateInput: HTMLInputElement;
                let iFrameIntervalInput: HTMLInputElement;
                if (action === ControlEvent.TYPE_CHANGE_STREAM_PARAMETERS) {
                    const spoiler = document.createElement('div');
                    const spoilerLabel = document.createElement('label');
                    const spoilerCheck = document.createElement('input');

                    const innerDiv = document.createElement('div');
                    const id = `spoiler_video_${deviceName}_${decoderName}_${action}`;

                    spoiler.className = 'spoiler';
                    spoilerCheck.type = 'checkbox';
                    spoilerCheck.id = id;
                    spoilerLabel.htmlFor = id;
                    spoilerLabel.innerText = CommandControlEvent.CommandNames[action];
                    innerDiv.className = 'box';
                    spoiler.appendChild(spoilerCheck);
                    spoiler.appendChild(spoilerLabel);
                    spoiler.appendChild(innerDiv);

                    const bitrateWrap = document.createElement('div');
                    const bitrateLabel = document.createElement('label');
                    bitrateLabel.innerText = 'Bitrate:';
                    bitrateInput = document.createElement('input');
                    bitrateInput.placeholder = `bitrate (${stream.bitrate})`;
                    bitrateInput.value = stream.bitrate.toString();
                    bitrateWrap.appendChild(bitrateLabel);
                    bitrateWrap.appendChild(bitrateInput);

                    const framerateWrap = document.createElement('div');
                    const framerateLabel = document.createElement('label');
                    framerateLabel.innerText = 'Framerate:';
                    frameRateInput = document.createElement('input');
                    frameRateInput.placeholder = `framerate (${stream.frameRate})`;
                    frameRateInput.value = stream.frameRate.toString();
                    framerateWrap.appendChild(framerateLabel);
                    framerateWrap.appendChild(frameRateInput);

                    const iFrameIntervalWrap = document.createElement('div');
                    const iFrameIntervalLabel = document.createElement('label');
                    iFrameIntervalLabel.innerText = 'I-Frame Interval:';
                    iFrameIntervalInput = document.createElement('input');
                    iFrameIntervalInput.placeholder = `I-frame interval (${stream.iFrameInterval})`;
                    iFrameIntervalInput.value = stream.iFrameInterval.toString();
                    iFrameIntervalWrap.appendChild(iFrameIntervalLabel);
                    iFrameIntervalWrap.appendChild(iFrameIntervalInput);

                    innerDiv.appendChild(bitrateWrap);
                    innerDiv.appendChild(framerateWrap);
                    innerDiv.appendChild(iFrameIntervalWrap);
                    innerDiv.appendChild(btn);
                    cmdWrap.appendChild(spoiler);
                } else {
                    cmdWrap.appendChild(btn);
                }
                btn.innerText = CommandControlEvent.CommandNames[action];
                btn.onclick = () => {
                    let event: CommandControlEvent|undefined;
                    if (action === ControlEvent.TYPE_CHANGE_STREAM_PARAMETERS) {
                        const bitrate = parseInt(bitrateInput.value, 10);
                        const frameRate = parseInt(frameRateInput.value, 10);
                        const iFrameInterval = parseInt(iFrameIntervalInput.value, 10);
                        if (isNaN(bitrate) || isNaN(frameRate)) {
                            return;
                        }
                        const width = document.body.clientWidth & ~15;
                        const height = document.body.clientHeight & ~15;
                        const maxSize = Math.min(width, height);
                        event = CommandControlEvent.createSetVideoSettingsCommand(new VideoSettings({
                            maxSize,
                            bitrate,
                            frameRate,
                            iFrameInterval,
                            lockedVideoOrientation: -1,
                            sendFrameMeta: false
                        }));
                    } else if (action === CommandControlEvent.TYPE_SET_CLIPBOARD) {
                        const text = input.value;
                        if (text) {
                            event = CommandControlEvent.createSetClipboard(text);
                        }
                    } else {
                        event = new CommandControlEvent(action);
                    }
                    if (event) {
                        connection.sendEvent(event);
                    }
                };
            }
        }
        const list = [{
            code: KeyEvent.KEYCODE_POWER,
            name: 'power'
        },{
            code: KeyEvent.KEYCODE_VOLUME_DOWN,
            name: 'volume-down'
        },{
            code: KeyEvent.KEYCODE_VOLUME_UP,
            name: 'volume-up'
        },{
            code: KeyEvent.KEYCODE_BACK,
            name: 'back'
        },{
            code: KeyEvent.KEYCODE_HOME,
            name: 'home'
        }, {
            code: KeyEvent.KEYCODE_APP_SWITCH,
            name: 'app-switch'
        }];
        list.forEach(item => {
            const {code, name} = item;
            const btn = document.createElement('button');
            btn.classList.add('control-button', name);
            btn.onmousedown = () => {
                const event = new KeyCodeControlEvent(KeyEvent.ACTION_DOWN, code, 0);
                connection.sendEvent(event);
            };
            btn.onmouseup = () => {
                const event = new KeyCodeControlEvent(KeyEvent.ACTION_UP, code, 0);
                connection.sendEvent(event);
            };
            deviceButtons.appendChild(btn);
        });
        box.appendChild(cmdWrap);

        const stop = (ev?: string | Event) => {
            if (ev && ev instanceof Event && ev.type === 'error') {
                console.error(ev);
            }
            connection.removeDecoder(decoder);
            let parent;
            parent = deviceView.parentElement;
            if (parent) {
                parent.removeChild(deviceView);
            }
            parent = controlsWrapper.parentElement;
            if (parent) {
                parent.removeChild(controlsWrapper);
            }
        };
        const stopBtn = document.createElement('button') as HTMLButtonElement;
        stopBtn.innerText = `Disconnect`;
        stopBtn.onclick = stop;
        box.appendChild(stopBtn);
        controlsWrapper.appendChild(wrapper);
        deviceView.appendChild(deviceButtons);
        const video = document.createElement('div');
        video.className = 'video';
        deviceView.appendChild(video);
        this.decoder.setParent(video);
        connection.setErrorListener(new ErrorHandler(stop));
    }

    public start(): void {
        document.body.append(this.deviceView);
        const temp = document.getElementById('controlsWrap');
        if (temp) {
            temp.appendChild(this.controls);
        }
    }

    public OnDeviceMessage(ev: DeviceMessage): void {
        switch (ev.type) {
            case DeviceMessage.TYPE_CLIPBOARD:
                this.input.value = ev.getText();
                this.input.select();
                document.execCommand('copy');
                break;
            default:
                console.error(`Unknown message type: ${ev.type}`);
        }
    }

}
