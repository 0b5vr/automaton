import * as lofi from "./lofi"
// @ponicode
describe("lofi.lofi", () => {
    test("0", () => {
        let callFunction: any = () => {
            lofi.lofi(100, 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("1", () => {
        let callFunction: any = () => {
            lofi.lofi(-5.48, 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("2", () => {
        let callFunction: any = () => {
            lofi.lofi(1, 0)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("3", () => {
        let callFunction: any = () => {
            lofi.lofi(100, 1)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("4", () => {
        let callFunction: any = () => {
            lofi.lofi(1, -100)
        }
    
        expect(callFunction).not.toThrow()
    })

    test("5", () => {
        let callFunction: any = () => {
            lofi.lofi(Infinity, Infinity)
        }
    
        expect(callFunction).not.toThrow()
    })
})
