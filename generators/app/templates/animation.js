import cubicBezier from './cubicBezier'
export class TimeLine {
    constructor() {
        this.animations = []
        this.startTime = null
        this.requestId = null
        this.pauseTime = null
        this.state = 'init'
    }
    tick() {
        this.animations = this.animations.filter((it) => !it.finished)

        let t = Date.now() - this.startTime

        for (let animation of this.animations) {
            const { object, property, template, delay, timingFunction, duration, addTime } = animation
            if (t > delay + duration + addTime) {
                animation.finished = true
                t = delay + duration + addTime
            }
            let progression = timingFunction((t - delay - addTime) / duration),
                value = animation.valueFromProgression(progression)
            object[property] = template(value)
        }
        if (this.animations.length) this.requestId = requestAnimationFrame(() => this.tick())
    }
    pause() {
        if (this.state != 'playing') return
        this.state = 'paused'
        this.pauseTime = Date.now()
        if (this.requestId) cancelAnimationFrame(this.requestId)
    }
    resume() {
        if (this.state != 'paused') return
        this.state = 'playing'
        this.startTime += Date.now() - this.pauseTime
        this.tick()
    }
    start() {
        if (this.state != 'init') return
        this.state = 'playing'
        this.startTime = Date.now()
        this.tick()
    }

    restart() {
        this.startTime = null
        this.requestId = null
        this.pauseTime = null
        this.state = 'init'
        this.start()
    }

    reset(){
        this.animations = []
        this.startTime = null
        this.requestId = null
        this.pauseTime = null
        this.state = 'init'
    }

    add(animation, addTime) {
        let needRestart = !this.animations.length && this.state === 'playing'
        this.animations.push(animation)
        if (this.state === 'playing') {
            animation.addTime = addTime !== void 0 ? addTime : Date.now() - this.startTime
        } else if (this.state === 'paused') {
            animation.addTime = addTime !== void 0 ? addTime : this.pauseTime - this.startTime
        } else {
            animation.addTime = addTime !== void 0 ? addTime : 0
        }
        if (needRestart) {
            this.tick()
        }
    }
}

export class Animation {
    constructor({ object, property, template, start, end, duration, delay, timingFunction }) {
        this.object = object
        this.property = property
        this.template = template || ((val) => val)
        this.start = start
        this.end = end
        this.duration = duration
        this.delay = delay || 0
        this.timingFunction = timingFunction
    }
    valueFromProgression(progression) {
        return this.start + progression * (this.end - this.start)
    }
}

export class ColorAnimation extends Animation {
    constructor(props) {
        super(props)
    }
    valueFromProgression(progression) {
        let getVal = (prop) => this.start[prop] + progression * (this.end[prop] - this.start[prop])
        return `rgba(${getVal('r')},${getVal('g')},${getVal('b')},${getVal('a')})`
    }
}

export const ease = cubicBezier(0.25, 0.1, 0.25, 1)
export const linear = cubicBezier(0, 0, 1, 1)
