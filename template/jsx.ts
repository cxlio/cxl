import { Observable } from '../rx';

export type Binding = Observable<any>;
export type BindingFunction<T> = (el: T) => Binding | Binding[];

type TemplateElement<T> = {
	[P in keyof T]?: T[P];
} & {
	$?: BindingFunction<T>;
};

/*export type ElementMap = {
	[P in string]: TemplateElement<
		P extends keyof HTMLElementTagNameMap
			? HTMLElementTagNameMap[P]
			: HTMLElement
	>;
};*/

declare global {
	namespace JSX {
		interface IntrinsicElements {
			[key: string]: TemplateElement<HTMLElement>;
		}
	}
}
