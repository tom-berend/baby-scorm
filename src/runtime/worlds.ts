// this implements the different playgrounds for the student



/**
 * The Product interface declares the operations that all concrete products must
 * implement.
 */
interface IWorld {
    operation(): string
}

/** This is the factory, use the concrete classes below (like VT52) */
export abstract class World {   // exports as a type, always use a concrete class like 'VT52'
    height: number   // height and width in pixels
    width: number


    constructor(element: HTMLElement, height: number, width: number) {
        return (this)
    }
}


export class VT52 extends World {
    constructor(element: HTMLElement, height: number, width: number) {
        super(element, height, width)


    }
}
