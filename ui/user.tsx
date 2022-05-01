///<amd-module name="@cxl/ui/user.js"/>
import { Attribute, Augment, Component, get } from '@cxl/component';
import { T } from '@cxl/ui/core.js';
import { Avatar } from '@cxl/ui/avatar.js';
import { css } from '@cxl/ui/theme.js';
import { dom, expression } from '@cxl/tsx';
import { padding } from '@cxl/css';

export interface User {
	displayName?: string;
	isVerified: boolean;
	email: string;
	photoUrl?: string;
}

@Augment<UserVerified>(
	'cxl-user-verified',
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

@Augment<UserAvatar>('cxl-user-avatar', $ => (
	<Avatar src={get($, 'user').map(u => u?.photoUrl || '')} />
))
export class UserAvatar extends Component {
	@Attribute()
	user?: User;
}

@Augment<UserNavbar>(
	'cxl-user-navbar',
	$ => (
		<>
			<UserAvatar user={get($, 'user')} />
			{() => {
				const el = (
					<a className="name">
						{expression(
							$,
							get($, 'user').map(u => u?.displayName || 'Guest')
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
			...padding(32, 16, 24, 16),
		},
		name: {
			display: 'block',
			marginTop: 16,
			textDecoration: 'none',
			color: 'onSurface',
		},
		verified: { marginLeft: 8 },
		email: { font: 'subtitle2', marginTop: 8 },
	})
)
export class UserNavbar extends Component {
	@Attribute()
	accounthref = '';

	@Attribute()
	user?: User;
}
