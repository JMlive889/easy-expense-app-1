export function DesktopFooter() {
  return (
    <footer className="hidden lg:block border-t bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 D30 Output Partners LLC. All Rights Reserved.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Privacy Policy
            </a>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Terms of Service
            </a>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cookie Policy
            </a>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <a
              href="#"
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              GDPR
            </a>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            EasyExpenseApp.com
          </div>
        </div>
      </div>
    </footer>
  );
}
