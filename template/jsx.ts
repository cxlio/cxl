import { Observable } from '../rx';

export type Binding = Observable<any>;
export type BindingFunction<T> = (el: T) => Binding | Binding[];

export type ElementMap<T> = T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: HTMLElement;

type TemplateElement<P extends keyof HTMLElementTagNameMap> = Partial<
	HTMLElementTagNameMap[P]
> & {
	$?: BindingFunction<HTMLElementTagNameMap[P]>;
};

type TagNameMap = {
	[P in keyof HTMLElementTagNameMap]: TemplateElement<P>;
};

type Elements = TagNameMap;

declare global {
	interface HTMLElement {}

	namespace JSX {
		interface IntrinsicElements extends Elements {
			[key: string]: any;
		}
	}
}
