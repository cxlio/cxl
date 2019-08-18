declare module '@cxl/rx';

declare class Observable<T> {
	static create(A: any): Observable<any>;
	constructor(subscribe: any);
	pipe(operator: any): Observable<any>;
	subscribe(observer: any, error?: any, complete?: any): any;
}
