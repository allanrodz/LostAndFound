import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquiriesPage } from './inquiries.page';

describe('InquiriesPage', () => {
  let component: InquiriesPage;
  let fixture: ComponentFixture<InquiriesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InquiriesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
