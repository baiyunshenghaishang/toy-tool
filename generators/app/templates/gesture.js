export function enableGesture(element) {
    const allContext = Object.create(null)
    const MOUSE_SYMBOL = Symbol('mouse')

    if (!('ontouchstart' in window)) {
        element.addEventListener('mousedown', (e) => {
            allContext[MOUSE_SYMBOL] = Object.create(null)
            start(e, allContext[MOUSE_SYMBOL])
            const mouseMove = (e) => {
                move(e, allContext[MOUSE_SYMBOL])
            }
            const mouseUp = (e) => {
                document.removeEventListener('mousemove', mouseMove)
                document.removeEventListener('mouseup', mouseUp)
                end(e, allContext[MOUSE_SYMBOL])
                delete allContext[MOUSE_SYMBOL]
            }
            document.addEventListener('mousemove', mouseMove)
            document.addEventListener('mouseup', mouseUp)
        })
    }

    element.addEventListener('touchstart', (e) => {
        for (let touch of e.changedTouches) {
            allContext[touch.identifier] = Object.create(null)
            start(touch, allContext[touch.identifier])
        }
    })

    element.addEventListener('touchmove', (e) => {
        for (let touch of e.changedTouches) {
            move(touch, allContext[touch.identifier])
        }
    })

    element.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            end(touch, allContext[touch.identifier])
            delete allContext[touch.identifier]
        }
    })
    element.addEventListener('touchcancel', (e) => {
        for (let touch of e.changedTouches) {
            cencel(touch, allContext[touch.identifier])
            delete allContext[touch.identifier]
        }
    })

    const start = (e, context) => {
        dispatchEvent('start')
        context.startX = e.clientX
        context.startY = e.clientY
        context.isTap = true
        context.isPress = false
        context.isPan = false
        context.moves = []
        context.timeoutHandle = setTimeout(() => {
            if (context.isPan) return
            context.isTap = false
            context.isPress = true
            context.isPan = false
            dispatchEvent('pressstart')
        }, 500)
    }

    const move = (e, context) => {
        let dx = e.clientX - context.startX,
            dy = e.clientY - context.startY
        if (dx ** 2 + dy ** 2 > 100 && !context.isPan) {
            context.isTap = false
            context.isPress = false
            context.isPan = true
            dispatchEvent('panstart', {
                startX: context.startX,
                startY: context.startY,
                clientX: e.clientX,
                clientY: e.clientY,
            })
        }
        if (context.isPan) {
            context.moves.push({
                dx,
                dy,
                t: Date.now(),
            })
            context.moves = context.moves.filter((move) => Date.now() - move.t < 300)
            dispatchEvent('pan', {
                startX: context.startX,
                startY: context.startY,
                clientX: e.clientX,
                clientY: e.clientY,
            })
        }
    }

    const end = (e, context) => {
        let dx = e.clientX - context.startX,
            dy = e.clientY - context.startY
        if (context.isTap) {
            dispatchEvent('tap')
        }
        if (context.isPress) {
            dispatchEvent('pressend')
        }
        if (context.isPan) {
            let record = context.moves[0],
                speed = Math.sqrt((record.dx - dx) ** 2 + (record.dy - dy) ** 2) / (Date.now() - record.t),
                isFlick = speed > 1.5
            if (isFlick) {
                dispatchEvent('flick', {
                    startX: context.startX,
                    startY: context.startY,
                    clientX: e.clientX,
                    clientY: e.clientY,
                })
            }

            dispatchEvent('panend', {
                startX: context.startX,
                startY: context.startY,
                clientX: e.clientX,
                clientY: e.clientY,
                speed,
                isFlick,
            })
        }
        clearTimeout(context.timeoutHandle)
    }

    const cancel = (e, context) => {
        dispatchEvent('canceled')
        clearTimeout(context.timeoutHandle)
    }

    const dispatchEvent = (type, data = null) => {
        let event = new CustomEvent(type, { detail: data })
        element.dispatchEvent(event)
    }
}
