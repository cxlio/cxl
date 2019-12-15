import { Observable } from '../rx';

export type Binding = Observable<any>;
export type BindingFunction<T> = (el: T) => Binding | Binding[];

type TemplateElement<T> = {
	[P in keyof T]?: T[P];
} & {
	$?: BindingFunction<T>;
};

export type ElementMap<T> = T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: HTMLElement;

declare global {
	namespace JSX {
		interface IntrinsicElements {
			[key: string]: TemplateElement<HTMLElement>;
		}
	}
}
