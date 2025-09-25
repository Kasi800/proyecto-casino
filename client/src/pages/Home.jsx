export default function Home() {
  return (
    <section data-bs-version="5.1" class="menu menu2" group="Menu" plugins="DropDown, TouchSwipe" always-top="" global="" once="menu" not-draggable="" position-absolute="">
      <nav class="navbar navbar-dropdown" mbr-class="{'navbar-fixed-top':sticky,
                        'navbar-expand-lg':!collapsed,
                        'collapsed':collapsed}">
        <div class="container">
          <div class="navbar-brand">
            <span mbr-if="showLogo" class="navbar-logo">
              <a href="https://mobiri.se">
                <img src="https://r.mobirisesite.com/1858462/assets/images/photo-1517085908802-f56a43681c18.jpeg" alt="Mobirise Website Builder" mbr-style="{'height': logoSize + 'rem'}"/>
              </a>
            </span>
            <span mbr-if="showBrand" mbr-buttons="" mbr-theme-style="display-4" class="navbar-caption-wrap" data-toolbar="-mbrBtnMove,-mbrBtnAdd,-mbrBtnRemove,-iconFont"><a class="navbar-caption text-black" data-app-selector=".navbar-caption" href="https://mobiri.se" data-app-placeholder="Type Text">Tragaperras</a></span>
          </div>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-bs-toggle="collapse" data-target="#navbarSupportedContent" data-bs-target="#navbarSupportedContent" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation" mbr-if="showItems || showIcons || showButtons">
            <div class="hamburger">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent" mbr-if="showItems || showIcons || showButtons">
            <ul mbr-menu="" class="navbar-nav nav-dropdown" mbr-theme-style="display-4" mbr-if="showItems" mbr-class="{'nav-right': !showButtons,'navbar-nav-top-padding': isPublish && !showBrand && !showLogo}">
              <li class="nav-item">
                <a class="nav-link link text-black" href="https://mobiri.se" data-app-selector=".nav-link,.dropdown-item" data-app-placeholder="Type Text">Jugar</a>
              </li>
              <li class="nav-item">
                <a class="nav-link link text-black" href="https://mobiri.se" data-app-selector=".nav-link,.dropdown-item" data-app-placeholder="Type Text" aria-expanded="false">Promos</a>
              </li>
              <li class="nav-item">
                <a class="nav-link link text-black" href="https://mobiri.se" data-app-selector=".nav-link,.dropdown-item" data-app-placeholder="Type Text">VIP</a>
              </li>
            </ul>
            <div class="icons-menu" mbr-if="showIcons">
              <a class="iconfont-wrapper" href="https://mobiri.se">
                <span mbr-icon="" class="p-2 mbr-iconfont mobi-mbri-phone mobi-mbri"></span>
              </a>
              <a class="iconfont-wrapper" href="https://mobiri.se" mbr-if="iconsAmount > 1">
                <span mbr-icon="" class="p-2 mbr-iconfont mobi-mbri-letter mobi-mbri"></span>
              </a>
              <a class="iconfont-wrapper" href="https://mobiri.se" mbr-if="iconsAmount > 2">
                <span mbr-icon="" class="p-2 mbr-iconfont mobi-mbri-map-pin mobi-mbri"></span>
              </a>
              <a class="iconfont-wrapper" href="https://mobiri.se" mbr-if="iconsAmount > 3">
                <span mbr-icon="" class="p-2 mbr-iconfont mobi-mbri-shopping-cart mobi-mbri"></span>
              </a>
            </div>
            <div mbr-if="showButtons" mbr-buttons="" mbr-theme-style="display-4" class="navbar-buttons mbr-section-btn">
              <a class="btn btn-primary" href="https://mobiri.se" data-app-placeholder="Type Text">Entrar</a>
            </div>
          </div>
        </div>
      </nav>
    </section>
  );
}