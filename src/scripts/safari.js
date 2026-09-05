(() => {
				const userAgent = navigator.userAgent;
				const safariVersion = Number(userAgent.match(/Version\/(\d+)/)?.[1] ?? 0);
				const isIOS =
					/iP(?:hone|ad|od)/.test(userAgent) ||
					(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
				const isSafari =
					/Safari\//.test(userAgent) &&
					!/(?:CriOS|FxiOS|EdgiOS|OPiOS)/.test(userAgent);

				if (isIOS && isSafari && safariVersion >= 26) {
					document.documentElement.classList.add('ios-safari-liquid-glass');
				}
			})();
