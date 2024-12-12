import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeaponDetailComponent } from './weapon-detail.component';

describe('WeaponDetailComponent', () => {
  let component: WeaponDetailComponent;
  let fixture: ComponentFixture<WeaponDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeaponDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WeaponDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
