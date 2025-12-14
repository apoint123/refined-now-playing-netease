export class ImageInterceptorService {
	private _targetSize: number = 200;
	private _isPatched: boolean = false;
	private _originalDescriptor: PropertyDescriptor | undefined;

	constructor() {
		this._originalDescriptor = Object.getOwnPropertyDescriptor(
			HTMLImageElement.prototype,
			"src",
		);
	}

	/**
	 * @description 设置期望的封面大小
	 */
	public setTargetSize(size: number) {
		this._targetSize = size;
	}

	/**
	 * @description 开启封面拦截器
	 */
	public enable() {
		if (this._isPatched) return;

		const originalSet = this._originalDescriptor?.set;
		const originalGet = this._originalDescriptor?.get;
		const self = this;

		Object.defineProperty(HTMLImageElement.prototype, "src", {
			get: function (this: HTMLImageElement) {
				return originalGet?.call(this);
			},
			set: function (this: HTMLImageElement, src: string) {
				if (this.classList.contains("j-flag")) {
					const size = self._targetSize || 200;

					src = src.replace(/thumbnail=\d+y\d+/g, `thumbnail=${size}y${size}`);

					if (src.startsWith("data:image/gif;")) {
						src =
							"orpheus://cache/?https://p1.music.126.net/UeTuwE7pvjBpypWLudqukA==/3132508627578625.jpg";
					}
				}

				return originalSet?.call(this, src);
			},
		});

		this._isPatched = true;
		console.log("[RefinedNowPlaying] Image Interceptor Enabled");
	}

	public disable() {
		if (!this._isPatched || !this._originalDescriptor) return;
		Object.defineProperty(
			HTMLImageElement.prototype,
			"src",
			this._originalDescriptor,
		);
		this._isPatched = false;
	}
}

export const imageInterceptor = new ImageInterceptorService();
