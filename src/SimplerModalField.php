<?php

namespace Restruct\Silverstripe\Simpler;

use LeKoala\PureModal\PureModal;
use SilverStripe\View\Requirements;
use SilverStripe\ORM\FieldType\DBHTMLText;

/**
 * Drop-in replacement for PureModal that uses simpler.modal for rendering
 * instead of the CSS checkbox mechanism.
 *
 * Key advantage: Modal is appended to document.body (outside CMS form),
 * so forms in the modal work correctly - no iframe needed for form content!
 *
 * Usage: Change "use LeKoala\PureModal\PureModal" to
 *        "use Restruct\Silverstripe\Simpler\SimplerModalField as PureModal"
 */
class SimplerModalField extends PureModal
{
    /**
     * Include required JS for simpler modal functionality
     */
    public static function set_requirements(): void
    {
        Requirements::javascript('restruct/silverstripe-simpler:client/dist/js/simpler-modal.js', ['type' => 'module']);
    }

    /**
     * Override constructor to make $content optional
     */
    public function __construct(string $name, string $title, string $content = '')
    {
        parent::__construct($name, $title, $content);
    }

    /**
     * Default iframe height (CSS value)
     */
    protected string $iframeHeight = '70vh';

    /**
     * Dialog title (separate from button title)
     */
    protected ?string $dialogTitle = null;

    /**
     * Modal size: 'sm', 'lg', 'xl' for Bootstrap sizes, or custom CSS value like '800px', '90vw'
     */
    protected ?string $modalSize = null;

    /**
     * Whether to show the close button in modal footer
     */
    protected bool $closeBtn = true;

    public function setIframeHeight(string $height): self
    {
        $this->iframeHeight = $height;
        return $this;
    }

    public function getIframeHeight(): string
    {
        return $this->iframeHeight;
    }

    /**
     * Alias for setIframe() with more descriptive name
     */
    public function setIframeSrc(string $url): self
    {
        return $this->setIframe($url);
    }

    /**
     * Set the dialog title (defaults to button title if not set)
     */
    public function setDialogTitle(string $title): self
    {
        $this->dialogTitle = $title;
        return $this;
    }

    public function getDialogTitle(): ?string
    {
        return $this->dialogTitle;
    }

    /**
     * Set modal size: 'sm', 'lg', 'xl' for Bootstrap sizes, or custom CSS value like '800px', '90vw'
     */
    public function setModalSize(string $size): self
    {
        $this->modalSize = $size;
        return $this;
    }

    public function getModalSize(): ?string
    {
        return $this->modalSize;
    }

    /**
     * Show or hide the close button in modal footer
     */
    public function setCloseBtn(bool $show): self
    {
        $this->closeBtn = $show;
        return $this;
    }

    /**
     * Build JSON config for data attribute
     */
    public function getModalConfig(): array
    {
        $config = [
            'title' => $this->getDialogTitle() ?: $this->Title(),
            'closeBtn' => $this->closeBtn,
            'closeTxt' => 'Close',
            'saveBtn' => false,
            'saveTxt' => 'Save',
        ];

        // Add size if set
        if ($this->modalSize) {
            $config['size'] = $this->modalSize;
        }

        // Handle iframe vs HTML content
        $iframe = $this->getIframe();
        if ($iframe) {
            $config['bodyHtml'] = sprintf(
                '<iframe src="%s" style="width:100%%;height:%s;border:none" frameborder="0"></iframe>',
                htmlspecialchars($iframe),
                $this->iframeHeight
            );
        } else {
            $content = $this->getContent();
            if ($content) {
                $config['bodyHtml'] = is_string($content) ? $content : $content->forTemplate();
            } else {
                $config['bodyHtml'] = '';
            }
        }

        return $config;
    }

    /**
     * JSON-encoded config for data attribute
     */
    public function getModalConfigJSON(): string
    {
        return json_encode($this->getModalConfig(), JSON_HEX_APOS | JSON_HEX_QUOT);
    }

    /**
     * @param array<string,mixed> $properties
     * @return DBHTMLText
     */
    public function Field($properties = []): DBHTMLText
    {
        self::set_requirements();

        // Handle button icon
        $icon = $this->getButtonIcon();
        if ($icon) {
            $this->addExtraClass('font-icon');
            $this->addExtraClass('font-icon-' . $icon);
        }

        // Use our own template
        return $this->renderWith(self::class);
    }
}
