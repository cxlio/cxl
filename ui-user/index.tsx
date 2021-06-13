import {
	Attribute,
	Augment,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { Avatar, T } from '@cxl/ui';
import { css } from '@cxl/css';
import { dom, expression } from '@cxl/tsx';

export interface User {
	displayName?: string;
	isVerified: boolean;
	email: string;
	photoUrl?: string;
}

@Augment<UserVerified>(
	'coaxial-user-verified',
	host => {
		const isVerified = get(host, 'verified');

		return (
			<T
				caption
				inline
				className={isVerified.map(val => (val ? 'verified' : ''))}
			>
				{isVerified.map(val =>
					val ? '\u2713 Verified' : '\u274c Not Verified'
				)}
			</T>
		);
	},
	css({
		$: { color: 'error', textAlign: 'right' },
		icon: { marginRight: 8 },
		verified: { color: 'primary' },
	})
)
export class UserVerified extends Component {
	@Attribute()
	verified = false;
}

@Augment<UserPhoto>(
	'coaxial-user-photo',
	$ => <Avatar className="avatar" src={get($, 'src')} />,
	css({
		$: { display: 'inline-block' },
		avatar$small: { width: 48, height: 48 },
		avatar: {
			width: 128,
			height: 128,
			display: 'inline-block',
			borderRadius: '50%',
			backgroundColor: 'primary',
			color: 'onPrimary',
		},
	})
)
export class UserPhoto extends Component {
	@Attribute()
	src = '';

	@StyleAttribute()
	small = false;
}

@Augment<UserEditPhoto>(
	'coaxial-user-edit-photo',
	$ => (
		<UserPhoto
			className="photo"
			src={get($, 'user').map(u => u?.photoUrl || '')}
		/>
	),
	css({
		$: { display: 'block', textAlign: 'center' },
		photo: { marginBottom: 16 },
	})
)
export class UserEditPhoto extends Component {
	@Attribute()
	user?: User;
}

@Augment<UserNavbar>(
	'cxl-user-navbar',
	$ => (
		<>
			<UserPhoto small src={get($, 'user').map(u => u?.photoUrl || '')} />
			{() => {
				const el = (
					<a className="name">
						{expression(
							$,
							get($, 'user').map(u => u?.displayName)
						)}
						<UserVerified
							className="verified"
							verified={get($, 'user').map(
								u => u?.isVerified || false
							)}
						/>
					</a>
				) as HTMLAnchorElement;
				$.bind(get($, 'accounthref').tap(val => (el.href = val)));
				return el;
			}}
			<T className="email">{get($, 'user').map(u => u?.email)}</T>
		</>
	),
	css({
		$: {
			display: 'block',
		},
		name: {
			display: 'block',
			marginTop: 16,
			textDecoration: 'none',
			color: 'onSurface',
		},
		verified: { marginLeft: 8 },
		email: { font: 'subtitle2', marginTop: 8, marginBottom: 8 },
	})
)
export class UserNavbar extends Component {
	@Attribute()
	accounthref = '';

	@Attribute()
	user?: User;
}
